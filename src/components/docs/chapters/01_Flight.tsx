import { PulseOS_Simulator } from '../simulators/PulseOS_Simulator';

export function FlightChapter() {
    return (
        <div className="max-w-7xl mx-auto px-6 py-8 md:py-12">
             {/* Plain English Context Header */}
             <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4">
                <h2 className="text-3xl font-bold text-white mb-4">Flight School</h2>
                <p className="text-zinc-400 max-w-2xl mx-auto text-base leading-relaxed">
                    This is an interactive simulator of the actual dashboard. 
                    You can switch between <strong>Grid View</strong> (for visual monitoring) and <strong>List View</strong> (for data density) using the toggle in the top right.
                    Try clicking the highlighted buttons to see how the interface responds.
                </p>
            </div>
            
            {/* Simulator Container */}
            <div className="border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl bg-[#09090b] relative h-[700px] md:h-[800px] flex flex-col animate-in zoom-in-95 duration-700">
                <PulseOS_Simulator />
            </div>
        </div>
    )
}
