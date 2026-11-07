import {useState} from 'react';
import {t} from '../i18n';
import {api} from '../network/auth';
import {useMeta} from '../state/meta';
import {useConnected} from '../pwa';
import {track} from '../telemetry';
import s from '../App.module.css';
export default function Feedback(){
 const ready=useMeta(state=>Boolean(state.profile?.age13Confirmed));const online=useConnected();
 const [message,setMessage]=useState(''),[category,setCategory]=useState<keyof typeof t.feedbackTypes>('bug');
 const [status,setStatus]=useState<'idle'|'sending'|'success'|'error'|'limit'>('idle');
 if(!online||!ready)return <p>{online?t.feedbackAuth:t.offlineFeature}</p>;
 return <form className={s.options} onSubmit={event=>{event.preventDefault();setStatus('sending');void api('/api/feedback',{category,message:message.trim()}).then(()=>{setMessage('');setStatus('success');track('feedback_submit');},error=>setStatus(error.message==='FEEDBACK_RATE'?'limit':'error'));}}>
  <label>{t.feedbackCategory}<select value={category} onChange={event=>setCategory(event.target.value as typeof category)}>{Object.entries(t.feedbackTypes).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
  <label className={s.feedbackText}>{t.feedbackMessage}<textarea required minLength={10} maxLength={800} rows={5} value={message} onChange={event=>setMessage(event.target.value)}/></label>
  <button className={s.primary} disabled={status==='sending'||message.trim().length<10}>{t.feedbackSend}</button>
  {status==='success'?<p role="status">{t.feedbackSuccess}</p>:status==='limit'||status==='error'?<p role="alert">{status==='limit'?t.feedbackLimit:t.tryAgain}</p>:null}
 </form>;
}
