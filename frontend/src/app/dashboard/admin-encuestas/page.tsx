'use client';

import React from 'react';
import { FormInput, FileText, Send, Settings } from 'lucide-react';

export default function AdminEncuestasPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Administrador de Encuestas
          </h1>
          <p className="text-slate-500 mt-1">
            Crea formularios dinámicos y analiza los resultados.
          </p>
        </div>
        <button className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors">
          <FormInput size={18} />
          Crear Encuesta
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm col-span-1 md:col-span-3">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="text-slate-400" size={20} />
            <h3 className="font-semibold text-slate-900 text-lg">Encuestas Recientes</h3>
          </div>
          <div className="text-center py-12 text-slate-500">
            <p>No hay encuestas creadas aún.</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Settings size={18} className="text-slate-400" />
            Acciones Rápidas
          </h3>
          <div className="space-y-3">
            <button className="w-full text-left px-4 py-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700 flex items-center gap-2">
              <Send size={16} className="text-blue-500" />
              Enviar Recordatorios
            </button>
            <button className="w-full text-left px-4 py-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700 flex items-center gap-2">
              <FileText size={16} className="text-emerald-500" />
              Plantillas Guardadas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
