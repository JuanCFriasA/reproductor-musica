import React from 'react';
import { motion } from 'motion/react';
import { GENRES, MOODS } from '../types';
import { Zap, Wind, Moon, Dumbbell, CloudRain, Music as MusicIcon, ChevronRight } from 'lucide-react';

const iconMap: Record<string, any> = {
  Zap, Wind, Moon, Dumbbell, CloudRain, Music: MusicIcon
};

export function GenresView() {
  return (
    <div className="space-y-16">
      {/* Hero */}
      <section>
        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary mb-4 block">Exploración Sonora</span>
        <h2 className="text-4xl md:text-6xl font-extrabold font-headline tracking-tighter mb-4">
          Géneros y <span className="italic text-primary">Estados de Ánimo</span>
        </h2>
        <p className="max-w-2xl text-on-surface-variant text-lg font-light leading-relaxed">
          Navega a través de paisajes sonoros curados editorialmente para cada momento de tu existencia.
        </p>
      </section>

      {/* Genre Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {GENRES.map((genre) => (
          <motion.div 
            key={genre.id}
            whileHover={{ scale: 1.02 }}
            className="relative group overflow-hidden rounded-2xl h-64 bg-surface-high cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
            <img 
              src={genre.image} 
              alt={genre.name} 
              className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
              referrerPolicy="no-referrer"
            />
            <div className="absolute bottom-6 left-6 z-20">
              {genre.isPopular && (
                <span className="bg-primary text-background text-[10px] font-bold px-2 py-1 rounded mb-2 inline-block uppercase tracking-wider">
                  Popular
                </span>
              )}
              <h3 className="text-2xl font-black text-white font-headline tracking-tight">{genre.name}</h3>
            </div>
          </motion.div>
        ))}
      </section>

      {/* Featured Section */}
      <section>
        <div className="bg-surface-low rounded-[2rem] overflow-hidden p-8 md:p-12 relative group">
          <div className="relative z-20 md:w-1/2">
            <span className="text-primary font-bold text-xs uppercase tracking-[0.2em] mb-4 block">Experiencia Inmersiva</span>
            <h2 className="text-3xl md:text-5xl font-extrabold font-headline leading-tight mb-6">
              Vibras curadas para cada <span className="italic">dimensión</span>
            </h2>
            <p className="text-on-surface-variant mb-8 text-base md:text-lg">
              Algoritmos humanos diseñando la banda sonora de tu productividad, tu descanso o tu caos interno. No es solo música, es una frecuencia emocional.
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="bg-primary text-background px-8 py-3 rounded-full font-bold uppercase text-xs tracking-widest hover:scale-105 transition-transform">
                Explorar Dimensiones
              </button>
              <button className="border border-secondary/30 text-on-surface px-8 py-3 rounded-full font-bold uppercase text-xs tracking-widest hover:bg-surface-high transition-colors">
                Más Información
              </button>
            </div>
          </div>
          <div className="absolute top-0 right-0 h-full w-full md:w-1/2 hidden md:block">
            <div className="absolute inset-0 bg-gradient-to-r from-surface-low to-transparent z-10" />
            <img 
              src="https://picsum.photos/seed/abstract/1200/800" 
              alt="Abstract" 
              className="h-full w-full object-cover opacity-40 group-hover:scale-110 transition-transform duration-1000"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </section>

      {/* Moods */}
      <section>
        <div className="flex justify-between items-end mb-8">
          <h3 className="text-2xl font-bold font-headline tracking-tight">Estados de Ánimo</h3>
          <button className="text-primary font-bold text-xs uppercase tracking-widest hover:underline flex items-center gap-1">
            Ver Todos <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {MOODS.map((mood) => {
            const Icon = iconMap[mood.icon];
            return (
              <button 
                key={mood.id}
                className="flex flex-col items-center justify-center gap-3 p-8 rounded-2xl bg-surface-high hover:bg-primary/10 transition-all group"
              >
                <Icon className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold uppercase tracking-widest">{mood.name}</span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
