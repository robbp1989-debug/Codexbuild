import React from 'react';
import {useApp} from '../../context/AppContext';
export const SourceImportCard: React.FC = () => {
 const {setActiveTab}=useApp();
 return <section className="rounded-2xl border border-sky-200 bg-sky-50 p-5 text-slate-800"><h2 className="text-xl font-semibold">Bring your context</h2><p className="my-3">Import selected report excerpts or answer intake questions with Holly. Review everything before SHIFT uses it.</p><button className="rounded-full bg-sky-200 px-5 py-3 text-slate-900" onClick={()=>setActiveTab('personalize')}>Import reports or talk with Holly</button></section>;
};
