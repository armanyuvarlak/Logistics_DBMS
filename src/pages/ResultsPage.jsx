import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ResultsSection from '../components/ResultsSection';
import SummarySection from '../components/SummarySection';

const ResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get data from location state
  const data = location.state || { rows: [] };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="card">
        <div className="card-body">
          {data.calculationId && (
            <div className="mb-4 text-sm text-gray-600">
              Calculation ID: {data.calculationId}
              <br />
              Date: {new Date(data.timestamp).toLocaleString()}
            </div>
          )}
          <ResultsSection data={data} />
          <SummarySection data={data} />
        </div>
      </div>
    </div>
  );
};

export default ResultsPage; 