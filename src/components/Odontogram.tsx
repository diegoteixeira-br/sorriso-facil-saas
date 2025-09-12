import { useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

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
  onToothSelect: (tooth: number | null, faces: string[]) => void;
  selectedTeeth?: ToothState;
}

export function Odontogram({ onToothSelect, selectedTeeth = {} }: OdontogramProps) {
  const [toothStates, setToothStates] = useState<ToothState>(selectedTeeth);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);

  // Dentes permanentes (11-48)
  const permanentTeeth = {
    superior: [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28],
    inferior: [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]
  };

const handleToothClick = (toothNumber: number) => {
  if (selectedTooth === toothNumber) {
    setSelectedTooth(null); // Desmarca se clicar no mesmo dente
    onToothSelect(null, []); // Notifica o pai para limpar seleção
  } else {
    setSelectedTooth(toothNumber);
    const faces = toothStates[toothNumber]?.faces || {
      vestibular: false,
      lingual: false,
      mesial: false,
      distal: false,
      oclusal: false,
    };
    const selectedFaces = Object.entries(faces)
      .filter(([_, v]) => v)
      .map(([k]) => k);
    onToothSelect(toothNumber, selectedFaces);
  }
};

  const handleFaceSelect = (face: string) => {
    if (!selectedTooth) return;
    
    const currentState = toothStates[selectedTooth] || {
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
      [selectedTooth]: newState
    }));

    // Notifica o componente pai sobre a seleção
    const selectedFaces = Object.entries(newFaces)
      .filter(([_, selected]) => selected)
      .map(([face, _]) => face);

    onToothSelect(selectedTooth, selectedFaces);
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
    const isSelected = selectedTooth === toothNumber;
    const toothType = getToothType(toothNumber);
    
    const centerX = x + 15;
    const toothY = isUpper ? y + 15 : y + 5;

    // Cores baseadas no estado
    const fillColor = isSelected ? "hsl(var(--primary) / 0.3)" : "white";
    const strokeColor = isSelected ? "hsl(var(--primary))" : "hsl(var(--border))";
    const strokeWidth = isSelected ? "2" : "1";

    return (
      <g key={toothNumber}>
        {/* Diferentes formas para cada tipo de dente */}
        {toothType === 'incisivo' && (
          <g onClick={() => handleToothClick(toothNumber)} className="cursor-pointer">
            {/* Forma de incisivo - retangular com topo arredondado */}
            <path
              d={`M ${x + 8} ${toothY + 20} 
                  L ${x + 8} ${toothY + 8} 
                  Q ${x + 8} ${toothY + 2} ${x + 15} ${toothY}
                  Q ${x + 22} ${toothY + 2} ${x + 22} ${toothY + 8}
                  L ${x + 22} ${toothY + 20}
                  Z`}
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
          </g>
        )}
        
        {toothType === 'canino' && (
          <g onClick={() => handleToothClick(toothNumber)} className="cursor-pointer">
            {/* Forma de canino - pontiagudo */}
            <path
              d={`M ${x + 9} ${toothY + 22} 
                  L ${x + 9} ${toothY + 12} 
                  Q ${x + 9} ${toothY + 6} ${x + 15} ${toothY}
                  Q ${x + 21} ${toothY + 6} ${x + 21} ${toothY + 12}
                  L ${x + 21} ${toothY + 22}
                  Z`}
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
          </g>
        )}
        
        {toothType === 'premolar' && (
          <g onClick={() => handleToothClick(toothNumber)} className="cursor-pointer">
            {/* Forma de pré-molar - quadrado com topos arredondados */}
            <rect
              x={x + 7}
              y={toothY + 4}
              width={16}
              height={18}
              rx="3"
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            {/* Cúspides */}
            <circle cx={x + 11} cy={toothY + 6} r="2" fill={fillColor} stroke={strokeColor} strokeWidth="0.5"/>
            <circle cx={x + 19} cy={toothY + 6} r="2" fill={fillColor} stroke={strokeColor} strokeWidth="0.5"/>
          </g>
        )}
        
        {toothType === 'molar' && (
          <g onClick={() => handleToothClick(toothNumber)} className="cursor-pointer">
            {/* Forma de molar - retangular com múltiplas cúspides */}
            <rect
              x={x + 6}
              y={toothY + 5}
              width={18}
              height={17}
              rx="2"
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            {/* Cúspides do molar */}
            <circle cx={x + 10} cy={toothY + 7} r="1.5" fill={fillColor} stroke={strokeColor} strokeWidth="0.5"/>
            <circle cx={x + 15} cy={toothY + 7} r="1.5" fill={fillColor} stroke={strokeColor} strokeWidth="0.5"/>
            <circle cx={x + 20} cy={toothY + 7} r="1.5" fill={fillColor} stroke={strokeColor} strokeWidth="0.5"/>
          </g>
        )}

        {/* Número do dente */}
        <text
          x={centerX}
          y={isUpper ? y + 5 : y + 45}
          textAnchor="middle"
          fontSize="10"
          fill="hsl(var(--foreground))"
          className="pointer-events-none font-medium"
        >
          {toothNumber}
        </text>

        {/* Indicador de faces selecionadas */}
        {toothState?.selected && (
          <circle
            cx={x + 25}
            cy={toothY + 2}
            r="3"
            fill="hsl(var(--primary))"
            className="pointer-events-none"
          />
        )}
      </g>
    );
  };

  const calculateToothSpacing = () => {
    return 32; // Espaçamento fixo entre dentes
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
    <div className="w-full space-y-6">
      {/* Diagrama dos dentes */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Odontograma - Seleção de Dentes</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Clique em um dente para selecionar. Clique novamente para desmarcar.
        </p>
        
        <div className="space-y-8">
          {/* Arcada Superior */}
          <div>
            <h4 className="text-sm font-medium mb-3 text-muted-foreground">Arcada Superior</h4>
            <div className="flex justify-center">
              <svg width="550" height="60" viewBox="0 0 550 60" className="border border-border rounded bg-background">
                {renderArchSection(permanentTeeth.superior, 15, 10, true)}
              </svg>
            </div>
          </div>
          
          {/* Arcada Inferior */}
          <div>
            <h4 className="text-sm font-medium mb-3 text-muted-foreground">Arcada Inferior</h4>
            <div className="flex justify-center">
              <svg width="550" height="60" viewBox="0 0 550 60" className="border border-border rounded bg-background">
                {renderArchSection(permanentTeeth.inferior, 15, 10, false)}
              </svg>
            </div>
          </div>
        </div>
      </Card>

      {/* Seleção de faces */}
      {selectedTooth && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            Selecione as Faces - Dente {selectedTooth}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {['vestibular', 'lingual', 'mesial', 'distal', 'oclusal'].map((face) => {
              const currentState = toothStates[selectedTooth];
              const isSelected = currentState?.faces?.[face as keyof typeof currentState.faces] || false;
              return (
                <Button
                  key={face}
                  variant={isSelected ? "default" : "outline"}
                  onClick={() => handleFaceSelect(face)}
                  className="capitalize"
                >
                  {face}
                </Button>
              );
            })}
          </div>
          
          {toothStates[selectedTooth]?.selected && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Faces selecionadas:</p>
              <p className="font-medium">
                {Object.entries(toothStates[selectedTooth].faces)
                  .filter(([_, selected]) => selected)
                  .map(([face, _]) => face)
                  .join(', ')}
              </p>
            </div>
          )}
        </Card>
      )}
      
      {!selectedTooth && (
        <Card className="p-6">
          <p className="text-muted-foreground text-center">
            Clique em um dente acima para selecionar as faces
          </p>
        </Card>
      )}
    </div>
  );
}