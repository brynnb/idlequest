import React from 'react';
import { Zone } from '../entities/Zone';

interface ZoneSelectorProps {
  zones: Zone[];
  selectedZone: Zone | null;
  onSelectZone: (zone: Zone) => void;
}

const ZoneSelector: React.FC<ZoneSelectorProps> = ({ zones, selectedZone, onSelectZone }) => {
  return (
    <div>
      {zones.map((zone) => (
        <button
          key={zone.id}
          onClick={() => onSelectZone(zone)}
          style={{
            backgroundColor: selectedZone?.id === zone.id ? '#007bff' : '#f8f9fa',
            color: selectedZone?.id === zone.id ? 'white' : 'black',
            margin: '5px',
            padding: '10px',
            border: '1px solid #ced4da',
            borderRadius: '4px',
          }}
        >
          {zone.long_name}
        </button>
      ))}
    </div>
  );
};

export default ZoneSelector;