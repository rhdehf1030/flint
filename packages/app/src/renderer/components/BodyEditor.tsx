import React, { useState } from 'react';

export type BodyType = 'none' | 'json' | 'form-data' | 'multipart' | 'raw';

interface Props {
  bodyType: BodyType;
  body: string;
  onBodyTypeChange: (type: BodyType) => void;
  onBodyChange: (body: string) => void;
}

const BODY_TYPES: BodyType[] = ['none', 'json', 'form-data', 'multipart', 'raw'];

export function BodyEditor({ bodyType, body, onBodyTypeChange, onBodyChange }: Props): React.ReactElement {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', gap: 2, padding: '4px 0', borderBottom: '1px solid #313244' }}>
        {BODY_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => onBodyTypeChange(type)}
            style={{
              background: bodyType === type ? '#313244' : 'transparent',
              border: 'none',
              color: bodyType === type ? '#cdd6f4' : '#585b70',
              padding: '2px 10px',
              cursor: 'pointer',
              fontSize: 12,
              borderRadius: 3,
            }}
          >
            {type}
          </button>
        ))}
      </div>
      {bodyType === 'none' ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#585b70', fontSize: 12 }}>
          No body
        </div>
      ) : (
        <textarea
          value={body}
          onChange={(e) => onBodyChange(e.target.value)}
          placeholder={bodyType === 'json' ? '{\n  "key": "value"\n}' : 'key=value\n...'}
          style={{
            flex: 1,
            background: '#1e1e2e',
            color: '#cdd6f4',
            border: 'none',
            outline: 'none',
            resize: 'none',
            fontFamily: 'monospace',
            fontSize: 12,
            padding: 8,
            lineHeight: 1.5,
          }}
        />
      )}
    </div>
  );
}
