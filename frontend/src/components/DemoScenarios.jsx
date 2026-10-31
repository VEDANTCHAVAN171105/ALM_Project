import React from "react";
import toast from "react-hot-toast";
import { Ambulance, CloudRain, Factory, Music4, PawPrint } from "lucide-react";


const scenarios = [
  {
    title: "Factory Floor",
    subtitle: "machinery + worker speech",
    icon: Factory,
    accent: "from-cyan/20 to-slate-500/10"
  },
  {
    title: "Emergency Call",
    subtitle: "siren + distressed speech",
    icon: Ambulance,
    accent: "from-danger/20 to-orange-500/10"
  },
  {
    title: "Outdoor Speech",
    subtitle: "rain + conversation",
    icon: CloudRain,
    accent: "from-sky-500/20 to-cyan/10"
  },
  {
    title: "Neighborhood",
    subtitle: "dog barking + ambient",
    icon: PawPrint,
    accent: "from-purple/20 to-cyan/10"
  },
  {
    title: "Music + Voice",
    subtitle: "singing + instruments",
    icon: Music4,
    accent: "from-pink-500/20 to-purple/10"
  }
];


function DemoScenarios() {
  return (
    <section className="space-y-5">
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-secondary">Professor Demo Helpers</p>
        <h2 className="mt-2 font-syne text-3xl font-bold text-primary">Suggested Demo Scenarios</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {scenarios.map((scenario) => {
          const Icon = scenario.icon;
          return (
            <button
              key={scenario.title}
              onClick={() => toast("Upload a real audio file matching this scenario to see ALM in action")}
              className={`glass-card rounded-[28px] bg-gradient-to-br ${scenario.accent} p-5 text-left transition hover:scale-[1.02]`}
            >
              <div className="mb-5 inline-flex rounded-2xl border border-white/10 bg-base/60 p-3 text-primary">
                <Icon size={22} />
              </div>
              <h3 className="font-syne text-xl font-semibold text-primary">{scenario.title}</h3>
              <p className="mt-2 text-sm text-secondary">{scenario.subtitle}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}


export default DemoScenarios;

