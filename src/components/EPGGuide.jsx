import { useState, useEffect } from 'react';
import { Clock, Calendar, Info } from 'lucide-react';

export default function EPGGuide({ channelId, onProgramSelect }) {
  const [currentProgram, setCurrentProgram] = useState(null);
  const [nextProgram, setNextProgram] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (channelId) {
      fetchEPGData();
    }
  }, [channelId, selectedDate]);

  const fetchEPGData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/api/epg/channel/${channelId}?date=${selectedDate}`);
      
      if (response.ok) {
        const data = await response.json();
        setCurrentProgram(data.current);
        setNextProgram(data.next);
        setSchedule(data.schedule || []);
      }
    } catch (error) {
      console.error('EPG fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (isoString) => {
    return new Date(isoString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getProgramProgress = (program) => {
    if (!program) return 0;
    
    const start = new Date(program.start).getTime();
    const end = new Date(program.end).getTime();
    const now = Date.now();
    
    if (now < start) return 0;
    if (now > end) return 100;
    
    return ((now - start) / (end - start)) * 100;
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Guide TV
        </h3>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="bg-gray-700 text-white rounded px-3 py-2 text-sm"
        />
      </div>

      {currentProgram && (
        <div className="bg-gray-700 rounded-lg p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 text-green-400 text-sm font-semibold mb-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                EN DIRECT
              </div>
              <h4 className="text-lg font-bold text-white">{currentProgram.title}</h4>
              <p className="text-gray-400 text-sm mt-1">{currentProgram.description}</p>
            </div>
            <div className="text-right text-sm text-gray-400">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatTime(currentProgram.start)} - {formatTime(currentProgram.end)}
              </div>
              <div className="mt-1">{currentProgram.duration} min</div>
            </div>
          </div>
          
          <div className="w-full bg-gray-600 rounded-full h-2">
            <div
              className="bg-red-500 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${getProgramProgress(currentProgram)}%` }}
            ></div>
          </div>
        </div>
      )}

      {nextProgram && (
        <div className="bg-gray-700/50 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="text-blue-400 text-sm font-semibold mb-1">À SUIVRE</div>
              <h4 className="text-white font-semibold">{nextProgram.title}</h4>
              <p className="text-gray-400 text-sm mt-1">{nextProgram.description}</p>
            </div>
            <div className="text-right text-sm text-gray-400">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatTime(nextProgram.start)}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <h4 className="text-white font-semibold">Programme complet</h4>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {schedule.map((program, index) => {
            const isNow = currentProgram?.id === program.id;
            
            return (
              <div
                key={program.id || index}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  isNow
                    ? 'bg-red-500/20 border border-red-500'
                    : 'bg-gray-700/50 hover:bg-gray-700'
                }`}
                onClick={() => onProgramSelect && onProgramSelect(program)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-sm">
                        {formatTime(program.start)}
                      </span>
                      {isNow && (
                        <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded">
                          LIVE
                        </span>
                      )}
                    </div>
                    <h5 className="text-white font-medium mt-1">{program.title}</h5>
                    {program.type && (
                      <span className="text-xs text-gray-400 mt-1 inline-block">
                        {program.type}
                      </span>
                    )}
                  </div>
                  <div className="text-gray-400 text-sm">
                    {program.duration} min
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
