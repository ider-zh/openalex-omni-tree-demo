interface DomainFilterProps {
  domains: string[];
  selectedDomain: string;
  onSelect: (domain: string) => void;
}

export function DomainFilter({ domains, selectedDomain, onSelect }: DomainFilterProps) {
  return (
    <div className="sidebar">
      <h3>Domains</h3>
      <div className="filter-list">
        <div
          className={`filter-item ${selectedDomain === 'all' ? 'active' : ''}`}
          onClick={() => onSelect('all')}
        >
          All Domains
        </div>
        {domains.map((domain) => (
          <div
            key={domain}
            className={`filter-item ${selectedDomain === domain ? 'active' : ''}`}
            onClick={() => onSelect(domain)}
          >
            {domain}
          </div>
        ))}
      </div>
    </div>
  );
}
