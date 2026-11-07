import {spawn} from 'node:child_process';
const children=[];
function run(args){const p=spawn(process.execPath,[process.env.npm_execpath,...args],{stdio:'inherit',env:process.env});children.push(p);p.on('exit',code=>{if(code)process.exitCode=code;});return p;}
const build=run(['build']);
build.on('exit',code=>{if(code===0){run(['exec','wrangler','dev','--local','--ip','127.0.0.1','--port','8787']);run(['dev:client']);}});
process.on('SIGINT',()=>{for(const p of children)p.kill();process.exit();});
