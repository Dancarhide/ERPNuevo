'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, Variants } from 'framer-motion';
import { FaBuilding, FaBullseye, FaEye, FaHandshake, FaSpinner } from 'react-icons/fa';
import { empresaApi } from '@/lib/api';

interface InfoEmpresa {
  mision: string;
  vision: string;
  historia: string;
  valores: string[];
  logo_url: string;
  banner_url: string;
}

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

export default function QuienesSomosPage() {
  const [info, setInfo] = useState<InfoEmpresa | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchInfo = useCallback(async () => {
    try {
      const data = await empresaApi.getInfo();
      setInfo(data);
    } catch (err) {
      console.error('Error fetching empresa info:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchInfo();
  }, [fetchInfo]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-400">
        <FaSpinner className="w-12 h-12 animate-spin text-primary" />
        <p className="mt-4 text-lg font-medium">Cargando identidad corporativa...</p>
      </div>
    );
  }

  if (!info) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-500 text-lg">La información de la empresa no está disponible.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Hero Section */}
      <div className="relative w-full h-[40vh] min-h-[300px] overflow-hidden bg-slate-900 rounded-b-[3rem] shadow-xl">
        {info.banner_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={info.banner_url}
            alt="Banner de la empresa"
            className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />

        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.7, ease: 'backOut' }}
            className="mb-6 bg-white/10 p-4 rounded-3xl backdrop-blur-md border border-white/20 shadow-2xl"
          >
            {info.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={info.logo_url}
                alt="Logo"
                className="w-auto h-24 object-contain drop-shadow-md"
              />
            ) : (
              <FaBuilding className="w-20 h-20 text-white drop-shadow-lg" />
            )}
          </motion.div>
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-4xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-lg"
          >
            Nuestra Identidad
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-4 text-lg text-slate-200 max-w-2xl font-light"
          >
            Conoce el propósito que nos mueve y los valores que nos definen cada día.
          </motion.p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-16 relative z-10">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          {/* Misión */}
          <motion.div variants={fadeInUp} className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent rounded-3xl blur-xl group-hover:blur-2xl transition-all opacity-0 group-hover:opacity-100" />
            <div className="relative h-full p-8 bg-white/80 backdrop-blur-xl border border-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-4 rounded-2xl bg-primary/10 text-primary">
                  <FaBullseye className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Nuestra Misión</h2>
              </div>
              <p className="text-slate-600 leading-relaxed text-lg">
                {info.mision || 'Aún no se ha definido una misión.'}
              </p>
            </div>
          </motion.div>

          {/* Visión */}
          <motion.div variants={fadeInUp} className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-transparent rounded-3xl blur-xl group-hover:blur-2xl transition-all opacity-0 group-hover:opacity-100" />
            <div className="relative h-full p-8 bg-white/80 backdrop-blur-xl border border-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-4 rounded-2xl bg-blue-500/10 text-blue-500">
                  <FaEye className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Nuestra Visión</h2>
              </div>
              <p className="text-slate-600 leading-relaxed text-lg">
                {info.vision || 'Aún no se ha definido una visión.'}
              </p>
            </div>
          </motion.div>
        </motion.div>

        {/* Valores */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7 }}
          className="mt-16"
        >
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-slate-800 inline-flex items-center gap-3">
              <FaHandshake className="text-emerald-500" />
              Valores Corporativos
            </h2>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            {info.valores && info.valores.length > 0 ? (
              info.valores.map((valor, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1, duration: 0.5 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="px-6 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm text-lg font-semibold text-slate-700 hover:shadow-md hover:border-emerald-200 transition-all cursor-default"
                >
                  {valor}
                </motion.div>
              ))
            ) : (
              <p className="text-slate-500 italic">No se han definido valores corporativos aún.</p>
            )}
          </div>
        </motion.div>

        {/* Historia / Sobre Nosotros */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7 }}
          className="mt-20 p-10 bg-white rounded-[2.5rem] shadow-xl border border-slate-100 relative overflow-hidden"
        >
          {/* Decorative Blob */}
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />

          <h2 className="text-3xl font-bold text-slate-800 mb-8 relative z-10">Sobre Nosotros</h2>
          <div className="relative z-10 prose prose-lg prose-slate max-w-none prose-headings:text-slate-800 prose-a:text-primary">
            {info.historia ? (
              <div dangerouslySetInnerHTML={{ __html: info.historia }} />
            ) : (
              <p className="text-slate-500 italic">
                No hay información sobre la historia de la empresa aún.
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
