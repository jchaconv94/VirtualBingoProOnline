import React, { useState, useRef } from 'react';
import { UserPlus, Upload, Download, FileSpreadsheet, Image as ImageIcon, RefreshCw } from 'lucide-react';
import { Participant } from '../types.ts';

interface Props {
  onRegister: (data: Omit<Participant, 'id' | 'cards'>, cardsCount: number) => void;
  onImport: (file: File) => void;
  onExport: () => void;
  onGenerateAllImages: () => void;
  totalParticipants: number;
}

const RegistrationPanel: React.FC<Props> = ({ onRegister, onImport, onExport, onGenerateAllImages, totalParticipants }) => {
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    dni: '',
    phone: '',
    cardsCount: 1
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.dni) return;
    
    onRegister(
      {
        name: formData.name,
        surname: formData.surname,
        dni: formData.dni,
        phone: formData.phone
      },
      formData.cardsCount
    );

    setFormData({
      name: '',
      surname: '',
      dni: '',
      phone: '',
      cardsCount: 1
    });
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <UserPlus className="text-cyan-500" size={24} />
          Registro
        </h2>
        <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded-full border border-slate-700">
          Total: {totalParticipants}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Nombre</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
              placeholder="Juan"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Apellidos</label>
            <input
              type="text"
              value={formData.surname}
              onChange={e => setFormData({...formData, surname: e.target.value})}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
              placeholder="Pérez"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">DNI / ID</label>
            <input
              type="text"
              required
              value={formData.dni}
              onChange={e => setFormData({...formData, dni: e.target.value})}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
              placeholder="12345678"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Teléfono</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
              placeholder="Opcional"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Cantidad de Cartones</label>
          <select
            value={formData.cardsCount}
            onChange={e => setFormData({...formData, cardsCount: Number(e.target.value)})}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2.5 rounded-lg transition-all shadow-lg shadow-cyan-900/20 flex items-center justify-center gap-2"
        >
          <UserPlus size={18} />
          Registrar y Generar
        </button>
      </form>

      <div className="my-6 border-t border-slate-800"></div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium py-2 px-3 rounded-lg border border-slate-700 transition-colors"
          >
            <Upload size={14} />
            Importar Excel
          </button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".xlsx, .xls"
            onChange={(e) => {
              if (e.target.files?.[0]) onImport(e.target.files[0]);
              e.target.value = ''; // reset
            }}
          />
          
          <button
            onClick={onExport}
            className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium py-2 px-3 rounded-lg border border-slate-700 transition-colors"
          >
            <FileSpreadsheet size={14} />
            Exportar Excel
          </button>
        </div>

        <button
          onClick={onGenerateAllImages}
          className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-medium py-2 px-3 rounded-lg border border-slate-700 transition-colors"
        >
          <ImageIcon size={14} />
          Descargar Todas las Imágenes (ZIP)
        </button>
      </div>

      <div className="mt-4 text-[10px] text-slate-500 leading-relaxed text-center">
        Importa/Exporta para respaldo. <br/>
        El ZIP puede tardar si hay muchos participantes.
      </div>
    </div>
  );
};

export default RegistrationPanel;