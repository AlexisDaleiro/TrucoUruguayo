import {Component,type ReactNode} from 'react';
import {reportClientError} from '../telemetry';

export class SceneBoundary extends Component<{children:ReactNode;fallback:ReactNode},{failed:boolean}>{
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true};}
 componentDidCatch(error:Error){
  reportClientError(error);
  if(!navigator.onLine)window.addEventListener('online',this.reload,{once:true});
 }
 componentWillUnmount(){window.removeEventListener('online',this.reload);}
 reload=()=>{location.reload();};
 render(){return this.state.failed?this.props.fallback:this.props.children;}
}
