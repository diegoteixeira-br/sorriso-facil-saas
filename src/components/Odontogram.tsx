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

  // Dentes permanentes (11-48)
  const permanentTeeth = {
    superior: [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28],
    inferior: [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]
  };

  const handleFaceClick = (toothNumber: number, face: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
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

  const getToothType = (toothNumber: number) => {
    // Determina o tipo do dente baseado na numeração
    const lastDigit = toothNumber % 10;
    if (lastDigit === 1 || lastDigit === 2) return 'incisivo';
    if (lastDigit === 3) return 'canino';
    if (lastDigit === 4 || lastDigit === 5) return 'premolar';
    if (lastDigit === 6 || lastDigit === 7 || lastDigit === 8) return 'molar';
    return 'incisivo';
  };

  const renderTooth = (toothNumber: number, x: number, y: number, isUpper: boolean) => {
    const toothState = toothStates[toothNumber];
    const toothType = getToothType(toothNumber);
    
    // Dimensões do dente baseadas no tipo
    const dimensions = {
      incisivo: { width: 20, height: 28 },
      canino: { width: 18, height: 32 },
      premolar: { width: 22, height: 26 },
      molar: { width: 26, height: 24 }
    };

    const { width, height } = dimensions[toothType];
    const centerX = x + width / 2;
    const centerY = y + height / 2;

    return (
      <g key={toothNumber}>
        {/* Formato realista do dente */}
        {toothType === 'incisivo' && (
          <path
            d={`M ${x + 2} ${y + height} 
                L ${x + 2} ${y + 8} 
                Q ${x + 2} ${y + 2} ${x + width/2} ${y}
                Q ${x + width - 2} ${y + 2} ${x + width - 2} ${y + 8}
                L ${x + width - 2} ${y + height}
                Z`}
            fill="white"
            stroke="#333"
            strokeWidth="1"
            className="cursor-pointer"
          />
        )}
        
        {toothType === 'canino' && (
          <path
            d={`M ${x + 3} ${y + height} 
                L ${x + 3} ${y + 10} 
                Q ${x + 3} ${y + 4} ${x + width/2} ${y}
                Q ${x + width - 3} ${y + 4} ${x + width - 3} ${y + 10}
                L ${x + width - 3} ${y + height}
                Z`}
            fill="white"
            stroke="#333"
            strokeWidth="1"
            className="cursor-pointer"
          />
        )}
        
        {(toothType === 'premolar' || toothType === 'molar') && (
          <rect
            x={x + 2}
            y={y + 4}
            width={width - 4}
            height={height - 4}
            rx="4"
            fill="white"
            stroke="#333"
            strokeWidth="1"
            className="cursor-pointer"
          />
        )}

        {/* Divisões das faces do dente */}
        
        {/* Face Vestibular (frente) */}
        <rect
          x={x + 2}
          y={y + 4}
          width={(width - 4) / 3}
          height={height - 8}
          fill={toothState?.faces?.vestibular ? "hsl(var(--primary))" : "transparent"}
          stroke="rgba(0,0,0,0.2)"
          strokeWidth="0.5"
          className="cursor-pointer hover:fill-primary/20"
          onClick={(e) => handleFaceClick(toothNumber, 'vestibular', e)}
        />
        
        {/* Face Oclusal/Incisal (topo) */}
        <rect
          x={x + 2 + (width - 4) / 3}
          y={y + 4}
          width={(width - 4) / 3}
          height={height - 8}
          fill={toothState?.faces?.oclusal ? "hsl(var(--primary))" : "transparent"}
          stroke="rgba(0,0,0,0.2)"
          strokeWidth="0.5"
          className="cursor-pointer hover:fill-primary/20"
          onClick={(e) => handleFaceClick(toothNumber, 'oclusal', e)}
        />
        
        {/* Face Lingual (atrás) */}
        <rect
          x={x + 2 + 2 * (width - 4) / 3}
          y={y + 4}
          width={(width - 4) / 3}
          height={height - 8}
          fill={toothState?.faces?.lingual ? "hsl(var(--primary))" : "transparent"}
          stroke="rgba(0,0,0,0.2)"
          strokeWidth="0.5"
          className="cursor-pointer hover:fill-primary/20"
          onClick={(e) => handleFaceClick(toothNumber, 'lingual', e)}
        />

        {/* Face Mesial (esquerda/direita) */}
        <rect
          x={x + 2}
          y={y + 4}
          width={width - 4}
          height={(height - 8) / 2}
          fill={toothState?.faces?.mesial ? "hsl(var(--primary))" : "transparent"}
          stroke="rgba(0,0,0,0.2)"
          strokeWidth="0.5"
          className="cursor-pointer hover:fill-primary/20"
          onClick={(e) => handleFaceClick(toothNumber, 'mesial', e)}
        />
        
        {/* Face Distal (esquerda/direita) */}
        <rect
          x={x + 2}
          y={y + 4 + (height - 8) / 2}
          width={width - 4}
          height={(height - 8) / 2}
          fill={toothState?.faces?.distal ? "hsl(var(--primary))" : "transparent"}
          stroke="rgba(0,0,0,0.2)"
          strokeWidth="0.5"
          className="cursor-pointer hover:fill-primary/20"
          onClick={(e) => handleFaceClick(toothNumber, 'distal', e)}
        />

        {/* Número do dente */}
        <text
          x={centerX}
          y={y + height + 12}
          textAnchor="middle"
          fontSize="10"
          fill="hsl(var(--foreground))"
          className="pointer-events-none font-medium"
        >
          {toothNumber}
        </text>

        {/* Marcação de dente com procedimento */}
        {toothState?.selected && (
          <circle
            cx={x + width - 4}
            cy={y + 6}
            r="3"
            fill="hsl(var(--primary))"
            className="pointer-events-none"
          />
        )}
      </g>
    );
  };

  const calculateToothSpacing = (toothNumber: number) => {
    const toothType = getToothType(toothNumber);
    const baseSpacing = {
      incisivo: 25,
      canino: 23,
      premolar: 27,
      molar: 31
    };
    return baseSpacing[toothType];
  };

  const renderArchSection = (teeth: number[], startX: number, y: number, isUpper: boolean) => {
    let currentX = startX;
    return teeth.map((tooth) => {
      const toothElement = renderTooth(tooth, currentX, y, isUpper);
      currentX += calculateToothSpacing(tooth);
      return toothElement;
    });
  };

  return (
    <div className="w-full">
      <div className="bg-card border border-border rounded-lg p-6">
        <svg width="800" height="280" className="w-full">
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.3"/>
            </pattern>
          </defs>
          
          {/* Background grid */}
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Cabeçalho profissional */}
          <text x="20" y="25" fontSize="16" fontWeight="bold" fill="hsl(var(--foreground))">
            ODONTOGRAMA - SELEÇÃO DE FACES
          </text>
          
          {/* Arcada Superior */}
          <text x="20" y="55" fontSize="14" fontWeight="600" fill="hsl(var(--foreground))">
            Arcada Superior
          </text>
          <line x1="20" y1="60" x2="780" y2="60" stroke="hsl(var(--border))" strokeWidth="1"/>
          
          {renderArchSection(permanentTeeth.superior, 60, 70, true)}

          {/* Arcada Inferior */}
          <text x="20" y="170" fontSize="14" fontWeight="600" fill="hsl(var(--foreground))">
            Arcada Inferior
          </text>
          <line x1="20" y1="175" x2="780" y2="175" stroke="hsl(var(--border))" strokeWidth="1"/>
          
          {renderArchSection(permanentTeeth.inferior, 60, 185, false)}
          
          {/* Legenda */}
          <text x="20" y="260" fontSize="12" fill="hsl(var(--muted-foreground))">
            Clique diretamente nas faces dos dentes para marcar os procedimentos
          </text>
        </svg>
      </div>
      
      {/* Legenda das faces */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-primary/20 border border-primary/40 rounded"></div>
          <span className="text-muted-foreground">Vestibular</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-primary/20 border border-primary/40 rounded"></div>
          <span className="text-muted-foreground">Lingual</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-primary/20 border border-primary/40 rounded"></div>
          <span className="text-muted-foreground">Mesial</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-primary/20 border border-primary/40 rounded"></div>
          <span className="text-muted-foreground">Distal</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-primary/20 border border-primary/40 rounded"></div>
          <span className="text-muted-foreground">Oclusal</span>
        </div>
      </div>
    </div>
  );
}