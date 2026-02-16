import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import RegistryList from '../components/RegistryList.jsx';
import DetailPanel from '../components/DetailPanel.jsx';

const sampleRegistry = [
    { id: '1', title: 'First', type: 'keep', status: 'Pending', snippet: 'alpha' },
    { id: '2', title: 'Second', type: 'keep', status: 'Execute', snippet: 'beta' },
    { id: '3', title: 'Third', type: 'keep', status: 'Complete', snippet: 'gamma' },
];

describe('Components rendering', () => {
    it('renders registry list with selection', () => {
        render(
            <RegistryList
                registry={sampleRegistry}
                selectedIndex={1}
                mode="MANUAL"
                registryRef={{ current: null }}
                getTagStyles={() => 'border-yellow-700/60 text-yellow-300'}
            />
        );
        expect(screen.getByText('Second')).toBeInTheDocument();
        expect(screen.getByText('First')).toBeInTheDocument();
        expect(screen.getByText('Third')).toBeInTheDocument();
    });

    it('renders detail panel for keep item', () => {
        render(
            <DetailPanel
                title="Sample"
                status="Pending"
                isKeep
                detailContent="Body text"
                detailItem={{ id: '1', foo: 'bar' }}
                detailLoading={false}
                detailError={null}
                detailRef={{ current: null }}
                onExit={() => {}}
            />
        );
        expect(screen.getByText('Detail: Sample')).toBeInTheDocument();
        expect(screen.getByText('Body text')).toBeInTheDocument();
    });
});
