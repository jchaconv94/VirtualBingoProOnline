import React, { useState } from 'react';
import { Search, Users, Medal, Ticket, Edit2, Trash2, Save, X } from 'lucide-react';
import { Participant, Winner } from '../types.ts';
import BingoCard from './BingoCard.tsx';

interface Props {
  participants: Participant[];
  drawnBalls: number[];
  winners: Winner[];
  onAddCard: (participantId: string) => void;
  onDeleteCard: (participantId: string, cardId: string) => void;
  onDownloadCard: (participant: Participant, cardId: string) => void;
  onEditParticipant: (id: string, data: { name: string, surname: string, dni: string, phone: string }) => void;
  onDeleteParticipant: (id: string) => void;
}

const ParticipantsPanel: React.FC<Props> = ({ 
  participants, 
  drawnBalls, 
  winners, 
  onAddCard, 
  onDeleteCard,
  onDownloadCard,
  onEditParticipant,
  onDeleteParticipant
}) => {
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', surname: '', dni: '', phone: '' });

  // Defensive filtering: convert fields to String before checking to prevent crashes if data is null/number
  const filteredParticipants = participants.filter(p => {
    const term = search.toLowerCase();
    const name = String(p.name || '').toLowerCase();
    const surname = String(p.surname || '').toLowerCase();
    const dni = String(p.dni || '').toLowerCase();

    return name.includes(term) || surname.includes(term) || dni.includes(term);
  });

  const startEdit = (p: Participant) => {
    setEditingId(p.id);
    setEditForm({ name: p.name, surname: p.surname, dni: p.dni, phone: p.phone || '' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ name: '', surname: '', dni: '', phone: '' });
  };

  const saveEdit = () => {
    if (editingId) {
      onEditParticipant(editingId, editForm);
      setEditingId(null);
    }
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-sm flex flex-col h-full">
      <div className="flex flex-col gap-4 mb-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="text-emerald-500" size={24} />
            Participantes
          </h2>
        </div>

        {/* Winners Section */}
        {winners.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 animate-in slide-in-from-top-2">
            <h3 className="text-amber-400 text-sm font-bold flex items-center gap-2 mb-2">
              <Medal size={16} /> GANADORES ({winners.length})
            </h3>
            <div className="max-h-24 overflow-y-auto custom-scrollbar space-y-1">
              {winners.map((w, i) => (
                <div key={i} className="text-xs text-amber-100 bg-amber-900/40 px-2 py-1 rounded flex justify-between">
                  <span>{w.participantName}</span>
                  <span className="font-mono opacity-70">{w.cardId}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input
            type="text"
            placeholder="Buscar por nombre o DNI..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
        {filteredParticipants.map(p => (
          <div key={p.id} className="bg-slate-950/50 rounded-xl p-4 border border-slate-800/50 hover:border-slate-700 transition-colors group">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-emerald-900/20 flex-shrink-0">
                {String(p.name || '?').charAt(0).toUpperCase()}
              </div>
              
              <div className="flex-1 min-w-0">
                {editingId === p.id ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input 
                        value={editForm.name} 
                        onChange={e => setEditForm({...editForm, name: e.target.value})}
                        className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white w-full"
                        placeholder="Nombre"
                      />
                      <input 
                        value={editForm.surname} 
                        onChange={e => setEditForm({...editForm, surname: e.target.value})}
                        className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white w-full"
                        placeholder="Apellido"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input 
                        value={editForm.dni} 
                        onChange={e => setEditForm({...editForm, dni: e.target.value})}
                        className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white w-full"
                        placeholder="DNI"
                      />
                      <input 
                        value={editForm.phone} 
                        onChange={e => setEditForm({...editForm, phone: e.target.value})}
                        className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white w-full"
                        placeholder="Teléfono"
                      />
                    </div>
                    <div className="flex gap-2 justify-end pt-1">
                      <button onClick={saveEdit} className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs transition-colors">
                        <Save size={12} /> Guardar
                      </button>
                      <button onClick={cancelEdit} className="flex items-center gap-1 px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-white text-xs transition-colors">
                        <X size={12} /> Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 
                        className="font-semibold text-slate-200 truncate group-hover:text-cyan-400 transition-colors" 
                        title={`${p.name} ${p.surname}`}
                      >
                        {p.name} {p.surname}
                      </h3>
                      <p className="text-xs text-slate-500 truncate">DNI: {p.dni} {p.phone && `• ${p.phone}`}</p>
                    </div>
                    
                    <div className="flex gap-1 items-start flex-shrink-0">
                       <button 
                        onClick={() => startEdit(p)}
                        className="p-1.5 text-slate-500 hover:text-cyan-400 hover:bg-cyan-950/30 rounded transition-colors"
                        title="Editar datos"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => onDeleteParticipant(p.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded transition-colors"
                        title="Eliminar participante"
                      >
                        <Trash2 size={14} />
                      </button>
                      <button 
                        onClick={() => onAddCard(p.id)}
                        className="ml-1 text-xs bg-slate-800 hover:bg-slate-700 text-emerald-400 px-2 py-1.5 rounded border border-slate-700 transition-colors flex items-center gap-1"
                        title="Agregar cartón extra"
                      >
                        <Ticket size={12} /> +1
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {p.cards.map(card => (
                <BingoCard 
                  key={card.id}
                  card={card}
                  drawnBalls={drawnBalls}
                  onDelete={(cid) => onDeleteCard(p.id, cid)}
                  onDownload={(cid) => onDownloadCard(p, cid)}
                  isCompact
                />
              ))}
            </div>
          </div>
        ))}
        
        {filteredParticipants.length === 0 && (
          <div className="text-center text-slate-600 py-10 italic text-sm">
            No se encontraron participantes
          </div>
        )}
      </div>
    </div>
  );
};

export default ParticipantsPanel;