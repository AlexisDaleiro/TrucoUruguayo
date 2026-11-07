import {init,captureException,close} from '@sentry/browser';
export function setup(dsn:string,allowed:()=>boolean){init({dsn,defaultIntegrations:false,dataCollection:{userInfo:false,cookies:false,httpBodies:[],httpHeaders:false,urlQueryParams:false,frameContextLines:0,stackFrameVariables:false,databaseQueryData:false,queues:false,genAI:{inputs:false,outputs:false},graphQL:{document:false,variables:false},mcp:{inputs:false,outputs:false}},beforeSend:event=>{if(!allowed())return null;delete event.user;delete event.request;delete event.extra;delete event.contexts;event.breadcrumbs=[];event.tags={app:'truco-de-boliche'};return event;}});}
export const capture=captureException;
export function shutdown(){return close(0);}
