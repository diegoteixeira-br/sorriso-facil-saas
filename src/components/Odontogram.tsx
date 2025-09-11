import { useState } from "react";

interface ToothState {
  [key: string]: {
    selected: boolean;
    faces: {
      vestibular: boolean;
      lingual: boolean;
      mesial: boolean;
      distal: boolean;
      oclusal: boolean;
    };
  };
}

interface OdontogramProps {
  onToothSelect: (tooth: number, faces: string[]) => void;
  selectedTeeth?: ToothState;
}

export function Odontogram({ onToothSelect, selectedTeeth = {} }: OdontogramProps) {
  const [toothStates, setToothStates] = useState<ToothState>(selectedTeeth);
  const [activeTooth, setActiveTooth] = useState<number | null>(null);

  // Dentes permanentes (11-48)
  const permanentTeeth = {
    superior: [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28],
    inferior: [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]
  };

  const handleToothClick = (toothNumber: number) => {
    if (activeTooth === toothNumber) {
      setActiveTooth(null);
    } else {
      setActiveTooth(toothNumber);
    }
  };

  const handleFaceSelect = (toothNumber: number, face: string) => {
    const currentState = toothStates[toothNumber] || {
      selected: false,
      faces: { vestibular: false, lingual: false, mesial: false, distal: false, oclusal: false }
    };

    const newFaces = {
      ...currentState.faces,
      [face]: !currentState.faces[face as keyof typeof currentState.faces]
    };

    const hasSelectedFaces = Object.values(newFaces).some(Boolean);

    const newState = {
      selected: hasSelectedFaces,
      faces: newFaces
    };

    setToothStates(prev => ({
      ...prev,
      [toothNumber]: newState
    }));

    // Notifica o componente pai sobre a seleção
    const selectedFaces = Object.entries(newFaces)
      .filter(([_, selected]) => selected)
      .map(([face, _]) => face);

    onToothSelect(toothNumber, selectedFaces);
  };

  const renderTooth = (toothNumber: number, x: number, y: number) => {
    const isSelected = toothStates[toothNumber]?.selected || false;
    const isActive = activeTooth === toothNumber;

    return (
      <g key={toothNumber}>
        <rect
          x={x}
          y={y}
          width="30"
          height="30"
          fill={isSelected ? "#3b82f6" : "#f3f4f6"}
          stroke={isActive ? "#ef4444" : "#d1d5db"}
          strokeWidth={isActive ? "2" : "1"}
          className="cursor-pointer hover:fill-blue-100"
          onClick={() => handleToothClick(toothNumber)}
        />
        <text
          x={x + 15}
          y={y + 20}
          textAnchor="middle"
          fontSize="12"
          fill={isSelected ? "white" : "black"}
          className="pointer-events-none"
        >
          {toothNumber}
        </text>
      </g>
    );
  };

  const renderFaceSelector = (toothNumber: number) => {
    if (activeTooth !== toothNumber) return null;

    const currentState = toothStates[toothNumber] || {
      selected: false,
      faces: { vestibular: false, lingual: false, mesial: false, distal: false, oclusal: false }
    };

    return (
      <div className="absolute top-full left-0 mt-2 bg-white border rounded-lg shadow-lg p-3 z-10">
        <div className="text-sm font-medium mb-2">Dente {toothNumber} - Selecionar Faces:</div>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(currentState.faces).map(([face, selected]) => (
            <button
              key={face}
              className={`px-2 py-1 text-xs rounded ${
                selected
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
              onClick={() => handleFaceSelect(toothNumber, face)}
            >
              {face.charAt(0).toUpperCase() + face.slice(1)}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="relative">
      <svg width="600" height="200" className="border rounded-lg bg-white">
        {/* Arcada Superior */}
        <text x="10" y="20" fontSize="14" fontWeight="bold">
          Arcada Superior
        </text>
        {permanentTeeth.superior.map((tooth, index) => 
          renderTooth(tooth, 50 + index * 35, 30)
        )}

        {/* Arcada Inferior */}
        <text x="10" y="120" fontSize="14" fontWeight="bold">
          Arcada Inferior
        </text>
        {permanentTeeth.inferior.map((tooth, index) => 
          renderTooth(tooth, 50 + index * 35, 130)
        )}
      </svg>

      {/* Seletor de faces */}
      {activeTooth && (
        <div className="relative">
          {renderFaceSelector(activeTooth)}
        </div>
      )}

      {/* Legenda */}
      <div className="mt-4 text-sm text-muted-foreground">
        <p>• Clique em um dente para selecionar suas faces</p>
        <p>• Dentes azuis: com procedimentos selecionados</p>
        <p>• Borda vermelha: dente ativo para seleção</p>
      </div>
    </div>
  );
}