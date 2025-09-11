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
  onToothSelect: (tooth: number, faces: string[]) => void;
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
    } else {
      setSelectedTooth(toothNumber);
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
    
    const width = 30;
    const height = 25;
    const centerX = x + width / 2;

    return (
      <g key={toothNumber}>
        {/* Retângulo simples para o dente */}
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={isSelected ? "hsl(var(--primary) / 0.2)" : "white"}
          stroke={isSelected ? "hsl(var(--primary))" : "hsl(var(--border))"}
          strokeWidth={isSelected ? "2" : "1"}
          className="cursor-pointer hover:fill-primary/10"
          onClick={() => handleToothClick(toothNumber)}
        />

        {/* Número do dente */}
        <text
          x={centerX}
          y={y + height / 2 + 3}
          textAnchor="middle"
          fontSize="12"
          fill="hsl(var(--foreground))"
          className="pointer-events-none font-medium"
        >
          {toothNumber}
        </text>

        {/* Indicador de faces selecionadas */}
        {toothState?.selected && (
          <circle
            cx={x + width - 4}
            cy={y + 4}
            r="3"
            fill="hsl(var(--primary))"
            className="pointer-events-none"
          />
        )}
      </g>
    );
  };

  const calculateToothSpacing = () => {
    return 35; // Espaçamento fixo entre dentes
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
      {/* Imagem de referência profissional */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Odontograma de Referência</h3>
        <div className="flex justify-center mb-4">
          <img 
            src="/lovable-uploads/daa2c721-a216-471a-a5b5-a8abd1628157.png" 
            alt="Odontograma de Referência Profissional" 
            className="max-w-full h-auto border border-border rounded-lg"
          />
        </div>
        <p className="text-sm text-muted-foreground text-center">
          Use esta referência para identificar os dentes e suas posições
        </p>
      </Card>

      {/* Diagrama dos dentes simplificado */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Selecione o Dente</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Clique em um número para selecionar o dente. Clique novamente para desmarcar.
        </p>
        
        <div className="space-y-8">
          {/* Arcada Superior */}
          <div>
            <h4 className="text-sm font-medium mb-3 text-muted-foreground">Arcada Superior</h4>
            <div className="flex justify-center">
              <div className="grid grid-cols-8 gap-2">
                {permanentTeeth.superior.slice(0, 8).reverse().map((tooth) => (
                  <Button
                    key={tooth}
                    variant={selectedTooth === tooth ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleToothClick(tooth)}
                    className="w-12 h-12 p-0 text-xs font-bold"
                  >
                    {tooth}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex justify-center mt-2">
              <div className="grid grid-cols-8 gap-2">
                {permanentTeeth.superior.slice(8).map((tooth) => (
                  <Button
                    key={tooth}
                    variant={selectedTooth === tooth ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleToothClick(tooth)}
                    className="w-12 h-12 p-0 text-xs font-bold"
                  >
                    {tooth}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Linha divisória */}
          <div className="border-t border-border"></div>
          
          {/* Arcada Inferior */}
          <div>
            <h4 className="text-sm font-medium mb-3 text-muted-foreground">Arcada Inferior</h4>
            <div className="flex justify-center">
              <div className="grid grid-cols-8 gap-2">
                {permanentTeeth.inferior.slice(0, 8).reverse().map((tooth) => (
                  <Button
                    key={tooth}
                    variant={selectedTooth === tooth ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleToothClick(tooth)}
                    className="w-12 h-12 p-0 text-xs font-bold"
                  >
                    {tooth}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex justify-center mt-2">
              <div className="grid grid-cols-8 gap-2">
                {permanentTeeth.inferior.slice(8).map((tooth) => (
                  <Button
                    key={tooth}
                    variant={selectedTooth === tooth ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleToothClick(tooth)}
                    className="w-12 h-12 p-0 text-xs font-bold"
                  >
                    {tooth}
                  </Button>
                ))}
              </div>
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
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setSelectedTooth(null)}
              size="sm"
            >
              Desmarcar Dente
            </Button>
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