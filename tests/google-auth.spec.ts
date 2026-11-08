import {expect,test,type Page} from '@playwright/test';

const provider='https://supabase.fixture.test';
const profile={id:'fixture-profile',nickname:'Paisano Google',character:'marta',wallet:17,xp:40,mmr:1000,loadout:{},regenAt:0,age13Confirmed:true};
const user={id:'fixture-google-user',aud:'authenticated',role:'authenticated',is_anonymous:false,app_metadata:{provider:'google'}};
const token=(sub:string)=>[
 Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url'),
 Buffer.from(JSON.stringify({sub,exp:Math.floor(Date.now()/1000)+3600})).toString('base64url'),
 'fixture',
].join('.');

async function configured(page:Page){
 await page.route('**/api/auth/config?profile=1',route=>route.fulfill({json:{mode:'supabase',url:provider,key:'fixture-publishable-key'}}));
}

test('la beta local no ofrece Google y una devolución cancelada muestra un aviso',async({page})=>{
 await page.goto('/?entrar=1');
 const onboarding=page.getByRole('dialog');
 await expect(onboarding.getByRole('heading',{name:'Antes de sentarte'})).toBeVisible();
 await expect(onboarding.getByRole('button',{name:/Entrar con Google/})).toHaveCount(0);

 await page.goto('/auth/callback?error=access_denied');
 const error=page.getByRole('dialog',{name:/Entrar con Google/});
 await expect(error.getByRole('alert')).toContainText('No se pudo completar el acceso con Google');
 await error.getByRole('button',{name:'Cerrar'}).click();
 await expect(onboarding.getByRole('heading',{name:'Antes de sentarte'})).toBeVisible();
 expect((await (await page.request.get('/api/auth/session')).json()).profile).toBeNull();
});

test('con Google configurado vuelve del proveedor y recupera el perfil',async({page})=>{
 await configured(page);
 const access=token(user.id);
 const callback=new URLSearchParams({access_token:access,refresh_token:'fixture-refresh',expires_in:'3600',token_type:'bearer'});
 await page.route('**/api/auth/logout',route=>route.fulfill({status:401,json:{error:'AUTH'}}));
 await page.route('**/api/auth/session',route=>route.fulfill({json:{profile:route.request().headers().authorization===`Bearer ${access}`?profile:null}}));
 await page.route(`${provider}/auth/v1/user`,route=>route.fulfill({json:user}));
 await page.route(`${provider}/auth/v1/authorize?**`,route=>{
  const request=new URL(route.request().url());
  const redirect=request.searchParams.get('redirect_to');
  expect(request.searchParams.get('provider')).toBe('google');
  expect(redirect).toMatch(/\/auth\/callback$/);
  return route.fulfill({status:302,headers:{location:`${redirect}#${callback}`}});
 });
 await page.goto('/?entrar=1');
 await page.getByRole('button',{name:/Entrar con Google/}).click();
 await expect(page.getByRole('button',{name:/Jugar/}).first()).toBeVisible();
 await expect(page.getByRole('button',{name:'Tus fichas'})).toContainText('17');
 await expect(page.getByRole('dialog')).toHaveCount(0);
 await expect(page).toHaveURL(/\/\?entrar=1$/);
});

test('un invitado de la beta obtiene sesión de Supabase antes de vincular Google',async({page})=>{
 await configured(page);
 const access=token(user.id);
 const anonymous={...user,is_anonymous:true,app_metadata:{provider:'anonymous'}};
 let authorizedProfileReads=0;
 await page.route('**/api/auth/session',route=>{
  if(route.request().headers().authorization===`Bearer ${access}`)authorizedProfileReads++;
  return route.fulfill({json:{profile}});
 });
 await page.route(`${provider}/auth/v1/signup`,route=>route.fulfill({json:{access_token:access,refresh_token:'fixture-refresh',expires_in:3600,token_type:'bearer',user:anonymous}}));
 await page.route(`${provider}/auth/v1/user/identities/authorize?**`,route=>{
  expect(route.request().headers().authorization).toBe(`Bearer ${access}`);
  return route.fulfill({status:400,json:{code:'provider_disabled',message:'Fixture cancellation'}});
 });
 await page.goto('/?entrar=1');
 await page.getByRole('button',{name:'Opciones',exact:true}).first().click();
 await page.getByRole('button',{name:'Vincular con Google'}).click();
 await expect(page.getByRole('dialog').getByRole('alert')).toContainText('No se pudo completar el acceso con Google');
 expect(authorizedProfileReads).toBeGreaterThan(0);
});
