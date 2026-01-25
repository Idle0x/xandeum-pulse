import { PulseOS_Simulator } from '../simulators/PulseOS_Simulator';

export function FlightChapter() {
    return (
        <div className="max-w-7xl mx-auto px-6 py-8 md:py-12">
             <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4">
                <h2 className="text-3xl font-bold text-white mb-2">Flight School Simulation</h2>
                <p className="text-zinc-500 max-w-xl mx-auto text-sm">
                    Pulse adapts to the operator. Use the simulator below to toggle between <span className="text-blue-400 font-bold">Grid Mode</span> (Visual) and <span className="text-emerald-400 font-bold">List Mode</span> (High Density).
                </p>
            </div>
            
            <div className="border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl bg-[#09090b] relative h-[700px] md:h-[800px] flex flex-col animate-in zoom-in-95 duration-700">
                <PulseOS_Simulator />
            </div>
        </div>
    )
}
