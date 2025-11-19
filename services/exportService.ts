import * as XLSX from 'xlsx';
import saveAs from 'file-saver';
import html2canvas from 'html2canvas';
import JSZip from 'jszip';
import { Participant, BingoCard } from '../types.ts';

// --- Excel Functions ---

export const exportToExcel = (participants: Participant[]) => {
  // Sheet 1: Participants
  const participantsData = participants.map(p => ({
    ID: p.id,
    Nombre: p.name,
    Apellidos: p.surname,
    DNI: p.dni,
    Telefono: p.phone || ''
  }));

  // Sheet 2: Cartones
  const cardsData: any[] = [];
  participants.forEach(p => {
    p.cards.forEach(c => {
      const row: any = {
        ID_Part: p.id,
        ID_Carton: c.id,
      };
      c.numbers.forEach((num, idx) => {
        row[`N${idx + 1}`] = num;
      });
      cardsData.push(row);
    });
  });

  const wb = XLSX.utils.book_new();
  const ws1 = XLSX.utils.json_to_sheet(participantsData);
  const ws2 = XLSX.utils.json_to_sheet(cardsData);

  XLSX.utils.book_append_sheet(wb, ws1, "Participantes");
  XLSX.utils.book_append_sheet(wb, ws2, "Cartones");

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
  saveAs(blob, `bingo_participantes_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

export const parseExcel = async (file: File): Promise<Participant[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        
        const wsP = wb.Sheets['Participantes'] || wb.Sheets[wb.SheetNames[0]];
        const wsC = wb.Sheets['Cartones'] || wb.Sheets[wb.SheetNames[1]];

        if (!wsP) throw new Error("No se encontró la hoja 'Participantes'");

        const rawPart = XLSX.utils.sheet_to_json(wsP) as any[];
        const rawCards = wsC ? XLSX.utils.sheet_to_json(wsC) as any[] : [];

        const participantsMap = new Map<string, Participant>();

        // Process Participants with strict String conversion
        rawPart.forEach(r => {
          const id = r.ID ? String(r.ID) : `P${Math.random().toString(36).substr(2, 6)}`;
          participantsMap.set(id, {
            id,
            name: r.Nombre ? String(r.Nombre) : 'Sin Nombre',
            surname: r.Apellidos ? String(r.Apellidos) : '',
            dni: r.DNI ? String(r.DNI) : '',
            phone: r.Telefono ? String(r.Telefono) : '',
            cards: []
          });
        });

        // Process Cards
        rawCards.forEach(r => {
          const pId = r.ID_Part ? String(r.ID_Part) : null;
          if (!pId) return;

          const participant = participantsMap.get(pId);
          if (participant) {
            const numbers: number[] = [];
            for (let i = 1; i <= 10; i++) {
              const val = parseInt(r[`N${i}`]);
              if (!isNaN(val)) numbers.push(val);
            }
            participant.cards.push({
              id: r.ID_Carton ? String(r.ID_Carton) : `C${Math.random().toString(36).substr(2, 4)}`,
              numbers: numbers
            });
          }
        });

        resolve(Array.from(participantsMap.values()));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};

// --- Image Generation Functions ---

// Helper to create a temporary DOM element for the card
const createTempCardElement = (participant: Participant, card: BingoCard): HTMLElement => {
  const container = document.createElement('div');
  Object.assign(container.style, {
    width: '600px',
    padding: '24px',
    background: 'linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)',
    color: '#0f172a',
    borderRadius: '16px',
    fontFamily: 'Inter, sans-serif',
    position: 'absolute',
    top: '-9999px',
    left: '-9999px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
  });

  const header = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;border-bottom:2px solid #e2e8f0;padding-bottom:12px;">
      <div>
        <h1 style="margin:0;font-size:28px;font-weight:800;color:#1e293b;text-transform:uppercase;letter-spacing:1px;">Bingo Virtual</h1>
        <div style="font-size:18px;margin-top:4px;color:#334155;font-weight:600;">${participant.name} ${participant.surname}</div>
        <div style="font-size:14px;color:#64748b;margin-top:2px;">DNI: ${participant.dni}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:24px;font-weight:700;color:#0f172a;">Cartón Nº ${card.id}</div>
        <div style="font-size:12px;color:#94a3b8;">${new Date().toLocaleDateString()}</div>
      </div>
    </div>
  `;

  let gridHtml = `<div style="display:grid;grid-template-columns:repeat(5, 1fr);gap:12px;">`;
  card.numbers.forEach(n => {
    gridHtml += `
      <div style="
        aspect-ratio: 1;
        display:flex;
        align-items:center;
        justify-content:center;
        background: #1e293b;
        color: #fff;
        font-size: 24px;
        font-weight: 700;
        border-radius: 12px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      ">${n}</div>
    `;
  });
  gridHtml += `</div>`;

  const footer = `
    <div style="margin-top:20px;text-align:center;font-size:12px;color:#94a3b8;border-top:1px dashed #cbd5e1;padding-top:12px;">
      ¡Buena suerte! • Sistema de Bingo Virtual <br><p style="font-size:8px">Desarrollado por • Ing. Jordan Chacón Villacis</p>
    </div>
  `;

  container.innerHTML = header + gridHtml + footer;
  return container;
};

export const downloadCardImage = async (participant: Participant, card: BingoCard) => {
  const el = createTempCardElement(participant, card);
  document.body.appendChild(el);
  try {
    const canvas = await html2canvas(el, { scale: 2, useCORS: true });
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
    if (blob) {
      saveAs(blob, `bingo_${participant.name.replace(/\s+/g,'_')}_${card.id}.png`);
    }
  } finally {
    document.body.removeChild(el);
  }
};

export const downloadAllCardsZip = async (participants: Participant[]) => {
  const zip = new JSZip();
  const folder = zip.folder("cartones_bingo");
  
  // To avoid freezing the UI, we'll process in chunks
  for (const p of participants) {
    for (const card of p.cards) {
      const el = createTempCardElement(p, card);
      document.body.appendChild(el);
      try {
        const canvas = await html2canvas(el, { scale: 1.5 }); // slightly lower scale for bulk to save memory
        const dataUrl = canvas.toDataURL('image/png');
        const base64 = dataUrl.split(',')[1];
        folder?.file(`${p.name.replace(/\s+/g,'_')}_${card.id}.png`, base64, { base64: true });
      } finally {
        document.body.removeChild(el);
      }
    }
  }

  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, "todos_cartones.zip");
};