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
    const baseSize = 24;
    
    // Layout profissional: 3 quadrados em linha horizontal
    const squareSize = 6;
    const spacing = 8;
    const totalWidth = (squareSize * 3) + (spacing * 2);
    const startX = x + (baseSize - totalWidth) / 2;
    const centerY = y + baseSize / 2 - squareSize / 2;

    return (
      <g key={toothNumber}>
        {/* Fundo do dente */}
        <rect
          x={x}
          y={y}
          width={baseSize}
          height={baseSize}
          fill="hsl(var(--card))"
          stroke="hsl(var(--border))"
          strokeWidth="1"
          rx="2"
        />

        {/* Face Vestibular (primeiro quadrado) */}
        <rect
          x={startX}
          y={centerY}
          width={squareSize}
          height={squareSize}
          fill={toothState?.faces?.vestibular ? "hsl(var(--primary))" : "white"}
          stroke="hsl(var(--border))"
          strokeWidth="0.8"
          className="cursor-pointer hover:fill-primary/30 transition-colors"
          onClick={(e) => handleFaceClick(toothNumber, 'vestibular', e)}
        />
        
        {/* Face Oclusal (segundo quadrado) */}
        <rect
          x={startX + squareSize + spacing}
          y={centerY}
          width={squareSize}
          height={squareSize}
          fill={toothState?.faces?.oclusal ? "hsl(var(--primary))" : "white"}
          stroke="hsl(var(--border))"
          strokeWidth="0.8"
          className="cursor-pointer hover:fill-primary/30 transition-colors"
          onClick={(e) => handleFaceClick(toothNumber, 'oclusal', e)}
        />
        
        {/* Face Lingual (terceiro quadrado) */}
        <rect
          x={startX + (squareSize + spacing) * 2}
          y={centerY}
          width={squareSize}
          height={squareSize}
          fill={toothState?.faces?.lingual ? "hsl(var(--primary))" : "white"}
          stroke="hsl(var(--border))"
          strokeWidth="0.8"
          className="cursor-pointer hover:fill-primary/30 transition-colors"
          onClick={(e) => handleFaceClick(toothNumber, 'lingual', e)}
        />

        {/* Faces Mesial e Distal (pequenos quadrados abaixo) */}
        <rect
          x={startX + 2}
          y={centerY + squareSize + 2}
          width={4}
          height={4}
          fill={toothState?.faces?.mesial ? "hsl(var(--primary))" : "white"}
          stroke="hsl(var(--border))"
          strokeWidth="0.5"
          className="cursor-pointer hover:fill-primary/30 transition-colors"
          onClick={(e) => handleFaceClick(toothNumber, 'mesial', e)}
        />
        
        <rect
          x={startX + squareSize + spacing + 2}
          y={centerY + squareSize + 2}
          width={4}
          height={4}
          fill={toothState?.faces?.distal ? "hsl(var(--primary))" : "white"}
          stroke="hsl(var(--border))"
          strokeWidth="0.5"
          className="cursor-pointer hover:fill-primary/30 transition-colors"
          onClick={(e) => handleFaceClick(toothNumber, 'distal', e)}
        />

        {/* Número do dente */}
        <text
          x={x + baseSize / 2}
          y={y + baseSize + 12}
          textAnchor="middle"
          fontSize="9"
          fill="hsl(var(--foreground))"
          className="pointer-events-none font-medium"
        >
          {toothNumber}
        </text>

        {/* Indicador de seleção */}
        {toothState?.selected && (
          <circle
            cx={x + baseSize - 3}
            cy={y + 3}
            r="2"
            fill="hsl(var(--primary))"
            className="pointer-events-none"
          />
        )}
      </g>
    );
  };

  const calculateToothSpacing = () => {
    return 30; // Espaçamento uniforme para layout profissional
  };

  const renderArchSection = (teeth: number[], startX: number, y: number, isUpper: boolean) => {
    let currentX = startX;
    return teeth.map((tooth) => {
      const toothElement = renderTooth(tooth, currentX, y, isUpper);
      currentX += calculateToothSpacing();
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