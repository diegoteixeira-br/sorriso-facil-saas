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
    
    // Dimensões do dente baseadas no tipo - aumentadas para melhor visualização
    const dimensions = {
      incisivo: { width: 32, height: 42 },
      canino: { width: 28, height: 48 },
      premolar: { width: 36, height: 38 },
      molar: { width: 42, height: 36 }
    };

    const { width, height } = dimensions[toothType];
    const centerX = x + width / 2;
    const centerY = y + height / 2;

    // Cores e gradientes para melhor visualização
    const gradientId = `tooth-${toothNumber}`;
    const shadowId = `shadow-${toothNumber}`;

    return (
      <g key={toothNumber}>
        <defs>
          {/* Gradiente para dar volume ao dente */}
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--background))" />
            <stop offset="50%" stopColor="white" />
            <stop offset="100%" stopColor="hsl(var(--muted))" />
          </linearGradient>
          
          {/* Sombra para profundidade */}
          <filter id={shadowId} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="1" dy="2" stdDeviation="1" floodColor="hsl(var(--border))" floodOpacity="0.3"/>
          </filter>
        </defs>

        {/* Formato anatômico mais realista do dente */}
        {toothType === 'incisivo' && (
          <path
            d={`M ${x + 4} ${y + height - 2}
                L ${x + 4} ${y + 12} 
                Q ${x + 4} ${y + 4} ${x + width/2} ${y + 2}
                Q ${x + width - 4} ${y + 4} ${x + width - 4} ${y + 12}
                L ${x + width - 4} ${y + height - 2}
                Q ${x + width - 4} ${y + height + 2} ${x + width/2} ${y + height + 4}
                Q ${x + 4} ${y + height + 2} ${x + 4} ${y + height - 2}
                Z`}
            fill={`url(#${gradientId})`}
            stroke="hsl(var(--border))"
            strokeWidth="1.5"
            filter={`url(#${shadowId})`}
            className="transition-all duration-200"
          />
        )}
        
        {toothType === 'canino' && (
          <path
            d={`M ${x + 6} ${y + height - 2}
                L ${x + 6} ${y + 16} 
                Q ${x + 6} ${y + 6} ${x + width/2} ${y + 2}
                Q ${x + width - 6} ${y + 6} ${x + width - 6} ${y + 16}
                L ${x + width - 6} ${y + height - 2}
                Q ${x + width - 6} ${y + height + 3} ${x + width/2} ${y + height + 5}
                Q ${x + 6} ${y + height + 3} ${x + 6} ${y + height - 2}
                Z`}
            fill={`url(#${gradientId})`}
            stroke="hsl(var(--border))"
            strokeWidth="1.5"
            filter={`url(#${shadowId})`}
            className="transition-all duration-200"
          />
        )}
        
        {toothType === 'premolar' && (
          <path
            d={`M ${x + 4} ${y + height - 2}
                L ${x + 4} ${y + 8}
                Q ${x + 4} ${y + 4} ${x + 8} ${y + 3}
                L ${x + width - 8} ${y + 3}
                Q ${x + width - 4} ${y + 4} ${x + width - 4} ${y + 8}
                L ${x + width - 4} ${y + height - 2}
                Q ${x + width - 4} ${y + height + 2} ${x + width - 8} ${y + height + 3}
                L ${x + 8} ${y + height + 3}
                Q ${x + 4} ${y + height + 2} ${x + 4} ${y + height - 2}
                Z`}
            fill={`url(#${gradientId})`}
            stroke="hsl(var(--border))"
            strokeWidth="1.5"
            filter={`url(#${shadowId})`}
            className="transition-all duration-200"
          />
        )}
        
        {toothType === 'molar' && (
          <path
            d={`M ${x + 4} ${y + height - 2}
                L ${x + 4} ${y + 6}
                Q ${x + 4} ${y + 3} ${x + 7} ${y + 3}
                L ${x + width - 7} ${y + 3}
                Q ${x + width - 4} ${y + 3} ${x + width - 4} ${y + 6}
                L ${x + width - 4} ${y + height - 2}
                Q ${x + width - 4} ${y + height + 1} ${x + width - 7} ${y + height + 2}
                L ${x + 7} ${y + height + 2}
                Q ${x + 4} ${y + height + 1} ${x + 4} ${y + height - 2}
                Z`}
            fill={`url(#${gradientId})`}
            stroke="hsl(var(--border))"
            strokeWidth="1.5"
            filter={`url(#${shadowId})`}
            className="transition-all duration-200"
          />
        )}

        {/* Faces do dente com formas anatômicas mais precisas */}
        
        {/* Face Vestibular (frente) - seção vertical esquerda */}
        <path
          d={toothType === 'incisivo' || toothType === 'canino' 
            ? `M ${x + 6} ${y + 8} L ${x + 6} ${y + height - 4} L ${x + width/3} ${y + height - 4} L ${x + width/3} ${y + 8} Z`
            : `M ${x + 6} ${y + 6} L ${x + 6} ${y + height - 3} L ${x + width/3} ${y + height - 3} L ${x + width/3} ${y + 6} Z`
          }
          fill={toothState?.faces?.vestibular ? "hsl(var(--primary) / 0.8)" : "transparent"}
          stroke={toothState?.faces?.vestibular ? "hsl(var(--primary))" : "hsl(var(--border) / 0.4)"}
          strokeWidth="1"
          className="cursor-pointer hover:fill-primary/30 transition-all duration-200"
          onClick={(e) => handleFaceClick(toothNumber, 'vestibular', e)}
        />
        
        {/* Face Oclusal/Incisal (centro) */}
        <path
          d={toothType === 'incisivo' || toothType === 'canino'
            ? `M ${x + width/3} ${y + 8} L ${x + width/3} ${y + height - 4} L ${x + 2*width/3} ${y + height - 4} L ${x + 2*width/3} ${y + 8} Z`
            : `M ${x + width/3} ${y + 6} L ${x + width/3} ${y + height - 3} L ${x + 2*width/3} ${y + height - 3} L ${x + 2*width/3} ${y + 6} Z`
          }
          fill={toothState?.faces?.oclusal ? "hsl(var(--primary) / 0.8)" : "transparent"}
          stroke={toothState?.faces?.oclusal ? "hsl(var(--primary))" : "hsl(var(--border) / 0.4)"}
          strokeWidth="1"
          className="cursor-pointer hover:fill-primary/30 transition-all duration-200"
          onClick={(e) => handleFaceClick(toothNumber, 'oclusal', e)}
        />
        
        {/* Face Lingual (atrás) - seção vertical direita */}
        <path
          d={toothType === 'incisivo' || toothType === 'canino'
            ? `M ${x + 2*width/3} ${y + 8} L ${x + 2*width/3} ${y + height - 4} L ${x + width - 6} ${y + height - 4} L ${x + width - 6} ${y + 8} Z`
            : `M ${x + 2*width/3} ${y + 6} L ${x + 2*width/3} ${y + height - 3} L ${x + width - 6} ${y + height - 3} L ${x + width - 6} ${y + 6} Z`
          }
          fill={toothState?.faces?.lingual ? "hsl(var(--primary) / 0.8)" : "transparent"}
          stroke={toothState?.faces?.lingual ? "hsl(var(--primary))" : "hsl(var(--border) / 0.4)"}
          strokeWidth="1"
          className="cursor-pointer hover:fill-primary/30 transition-all duration-200"
          onClick={(e) => handleFaceClick(toothNumber, 'lingual', e)}
        />

        {/* Face Mesial (superior) - seção horizontal superior */}
        <path
          d={toothType === 'incisivo' || toothType === 'canino'
            ? `M ${x + 6} ${y + 8} L ${x + width - 6} ${y + 8} L ${x + width - 6} ${y + (height - 8)/2 + 8} L ${x + 6} ${y + (height - 8)/2 + 8} Z`
            : `M ${x + 6} ${y + 6} L ${x + width - 6} ${y + 6} L ${x + width - 6} ${y + (height - 6)/2 + 6} L ${x + 6} ${y + (height - 6)/2 + 6} Z`
          }
          fill={toothState?.faces?.mesial ? "hsl(var(--primary) / 0.8)" : "transparent"}
          stroke={toothState?.faces?.mesial ? "hsl(var(--primary))" : "hsl(var(--border) / 0.4)"}
          strokeWidth="1"
          className="cursor-pointer hover:fill-primary/30 transition-all duration-200"
          onClick={(e) => handleFaceClick(toothNumber, 'mesial', e)}
        />
        
        {/* Face Distal (inferior) - seção horizontal inferior */}
        <path
          d={toothType === 'incisivo' || toothType === 'canino'
            ? `M ${x + 6} ${y + (height - 8)/2 + 8} L ${x + width - 6} ${y + (height - 8)/2 + 8} L ${x + width - 6} ${y + height - 4} L ${x + 6} ${y + height - 4} Z`
            : `M ${x + 6} ${y + (height - 6)/2 + 6} L ${x + width - 6} ${y + (height - 6)/2 + 6} L ${x + width - 6} ${y + height - 3} L ${x + 6} ${y + height - 3} Z`
          }
          fill={toothState?.faces?.distal ? "hsl(var(--primary) / 0.8)" : "transparent"}
          stroke={toothState?.faces?.distal ? "hsl(var(--primary))" : "hsl(var(--border) / 0.4)"}
          strokeWidth="1"
          className="cursor-pointer hover:fill-primary/30 transition-all duration-200"
          onClick={(e) => handleFaceClick(toothNumber, 'distal', e)}
        />

        {/* Número do dente com melhor posicionamento */}
        <text
          x={centerX}
          y={y + height + 16}
          textAnchor="middle"
          fontSize="11"
          fontWeight="600"
          fill="hsl(var(--foreground))"
          className="pointer-events-none select-none"
        >
          {toothNumber}
        </text>

        {/* Indicador visual de dente com procedimento selecionado */}
        {toothState?.selected && (
          <g>
            <circle
              cx={x + width - 6}
              cy={y + 8}
              r="4"
              fill="hsl(var(--primary))"
              stroke="white"
              strokeWidth="1"
              className="pointer-events-none animate-pulse"
            />
            <text
              x={x + width - 6}
              y={y + 12}
              textAnchor="middle"
              fontSize="8"
              fontWeight="bold"
              fill="white"
              className="pointer-events-none select-none"
            >
              ●
            </text>
          </g>
        )}

        {/* Tooltip com informações do dente (aparece no hover) */}
        <title>
          Dente {toothNumber} ({toothType})
          {toothState?.selected && `\nFaces selecionadas: ${Object.entries(toothState.faces).filter(([_, selected]) => selected).map(([face]) => face).join(', ')}`}
        </title>
      </g>
    );
  };

  const calculateToothSpacing = (toothNumber: number) => {
    const toothType = getToothType(toothNumber);
    const baseSpacing = {
      incisivo: 38,
      canino: 34,
      premolar: 42,
      molar: 48
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
        <svg width="1200" height="360" className="w-full" viewBox="0 0 1200 360">
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