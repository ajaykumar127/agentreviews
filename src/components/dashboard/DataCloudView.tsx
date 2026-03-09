import React from 'react';
import { Database, CheckCircle, XCircle, AlertCircle, Search, Link2, RefreshCw } from 'lucide-react';

interface DataCloudViewProps {
  dataCloudInfo?: {
    isEnabled: boolean;
    dataSources: any[];
    retrievers: any[];
    searchIndexes: any[];
    debugInfo?: {
      availableObjects: string[];
      dataCloudObjects: string[];
      queriesAttempted: string[];
      errors: string[];
    };
  };
  onScan?: () => void;
  scanning?: boolean;
  scanResults?: any;
}

export default function DataCloudView({ dataCloudInfo, onScan, scanning, scanResults }: DataCloudViewProps) {
  if (!dataCloudInfo) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <Database className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No Data Cloud information available</p>
      </div>
    );
  }

  const { isEnabled, dataSources, retrievers, searchIndexes } = dataCloudInfo;
  const hasAnyComponents = dataSources.length > 0 || retrievers.length > 0 || searchIndexes.length > 0;

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg border border-cyan-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-cyan-600 rounded-lg flex items-center justify-center">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Data Cloud Configuration</h2>
              <p className="text-sm text-gray-600 mt-1">
                Grounding data sources, retrievers, and search indexes
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasAnyComponents ? (
              <span className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                <CheckCircle className="w-4 h-4" />
                Configured
              </span>
            ) : (
              <span className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                <AlertCircle className="w-4 h-4" />
                Not Configured
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Data Sources Section */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link2 className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Data Sources</h3>
            </div>
            <span className="text-sm text-gray-500">{dataSources.length} configured</span>
          </div>
        </div>
        <div className="p-6">
          {dataSources.length === 0 ? (
            <div className="text-center py-8">
              <Link2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No data sources configured</p>
              <p className="text-gray-400 text-xs mt-1">
                Configure data sources to connect external systems and databases
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {dataSources.map((ds, idx) => {
                const isActive = ds.ConnectionStatus === 'Active';
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                      <div>
                        <p className="font-medium text-gray-900">{ds.Name}</p>
                        {ds.Type && (
                          <p className="text-xs text-gray-500 mt-0.5">Type: {ds.Type}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isActive ? (
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                          Active
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 bg-gray-200 text-gray-600 rounded-full font-medium">
                          {ds.ConnectionStatus || 'Inactive'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Retrievers Section */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Search className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">Retrievers</h3>
            </div>
            <span className="text-sm text-gray-500">{retrievers.length} configured</span>
          </div>
        </div>
        <div className="p-6">
          {retrievers.length === 0 ? (
            <div className="text-center py-8">
              <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No retrievers configured</p>
              <p className="text-gray-400 text-xs mt-1">
                Configure GenAI retrievers to enable semantic search capabilities
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {retrievers.map((retriever, idx) => {
                const isActive = retriever.Status === 'Active' || !retriever.Status;
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-purple-500' : 'bg-gray-400'}`} />
                      <div>
                        <p className="font-medium text-gray-900">
                          {retriever.Name || retriever.DeveloperName || 'Unnamed Retriever'}
                        </p>
                        {retriever.Type && (
                          <p className="text-xs text-gray-500 mt-0.5">Type: {retriever.Type}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {retriever.Status && (
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          isActive
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-gray-200 text-gray-600'
                        }`}>
                          {retriever.Status}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Search Indexes Section */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-gray-900">Search Indexes</h3>
            </div>
            <span className="text-sm text-gray-500">{searchIndexes.length} configured</span>
          </div>
        </div>
        <div className="p-6">
          {searchIndexes.length === 0 ? (
            <div className="text-center py-8">
              <Database className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No search indexes configured</p>
              <p className="text-gray-400 text-xs mt-1">
                Configure search indexes to optimize data retrieval performance
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {searchIndexes.map((index, idx) => {
                const isActive = index.Status === 'Active' || !index.Status;
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                      <div>
                        <p className="font-medium text-gray-900">
                          {index.Name || index.DeveloperName || 'Unnamed Index'}
                        </p>
                        {index.ObjectType && (
                          <p className="text-xs text-gray-500 mt-0.5">Object: {index.ObjectType}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {index.Status && (
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-200 text-gray-600'
                        }`}>
                          {index.Status}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Data Sources</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">{dataSources.length}</p>
            </div>
            <Link2 className="w-8 h-8 text-blue-300" />
          </div>
        </div>
        <div className="bg-purple-50 rounded-lg border border-purple-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Retrievers</p>
              <p className="text-2xl font-bold text-purple-900 mt-1">{retrievers.length}</p>
            </div>
            <Search className="w-8 h-8 text-purple-300" />
          </div>
        </div>
        <div className="bg-green-50 rounded-lg border border-green-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Search Indexes</p>
              <p className="text-2xl font-bold text-green-900 mt-1">{searchIndexes.length}</p>
            </div>
            <Database className="w-8 h-8 text-green-300" />
          </div>
        </div>
      </div>

      {/* Debug Information - Always show when no components found */}
      {hasAnyComponents === false && dataCloudInfo.debugInfo && (
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
          <h3 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Debug Information
          </h3>

          {/* Data Cloud Objects Found */}
          {dataCloudInfo.debugInfo.dataCloudObjects.length > 0 ? (
            <div className="mb-4">
              <p className="text-sm font-medium text-blue-800 mb-2">
                Found {dataCloudInfo.debugInfo.dataCloudObjects.length} Data Cloud related objects in your org:
              </p>
              <div className="bg-white rounded border border-blue-200 p-3 max-h-40 overflow-y-auto">
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  {dataCloudInfo.debugInfo.dataCloudObjects.map((obj, idx) => (
                    <div key={idx} className="text-blue-700">{obj}</div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded">
              <p className="text-sm text-amber-800">
                No Data Cloud objects found via describeGlobal(). This could mean Data Cloud is not fully enabled.
              </p>
            </div>
          )}

          {/* Queries Attempted */}
          {dataCloudInfo.debugInfo.queriesAttempted.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium text-blue-800 mb-2">
                Queries attempted ({dataCloudInfo.debugInfo.queriesAttempted.length}):
              </p>
              <details className="bg-white rounded border border-blue-200 p-3">
                <summary className="text-xs text-blue-700 cursor-pointer">View queries</summary>
                <div className="mt-2 space-y-1 text-xs font-mono text-gray-600">
                  {dataCloudInfo.debugInfo.queriesAttempted.map((query, idx) => (
                    <div key={idx}>{query}</div>
                  ))}
                </div>
              </details>
            </div>
          )}

          {/* Errors */}
          {dataCloudInfo.debugInfo.errors.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium text-red-800 mb-2">
                Errors encountered ({dataCloudInfo.debugInfo.errors.length}):
              </p>
              <div className="bg-red-50 rounded border border-red-200 p-3 text-xs text-red-700 space-y-1">
                {dataCloudInfo.debugInfo.errors.map((error, idx) => (
                  <div key={idx}>• {error}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Troubleshooting Section */}
      {hasAnyComponents === false && onScan && (
        <div className="bg-amber-50 rounded-lg border border-amber-200 p-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 mb-2">
                No Data Cloud components detected
              </h3>
              <p className="text-sm text-amber-800 mb-4">
                We couldn't find any data sources, retrievers, or search indexes. Possible reasons:
              </p>
              <ul className="text-sm text-amber-700 space-y-1 mb-4 list-disc list-inside">
                <li>Components haven't been configured yet in Data Cloud</li>
                <li>We're querying the wrong object API names</li>
                <li>Insufficient permissions to access these objects</li>
              </ul>
              <button
                onClick={onScan}
                disabled={scanning}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
                {scanning ? 'Scanning...' : 'Deep Scan for All Objects'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scan Results */}
      {scanResults && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="border-b border-gray-200 px-6 py-4">
            <h3 className="font-semibold text-gray-900">Data Cloud Object Scan Results</h3>
            <p className="text-sm text-gray-500 mt-1">
              Found {scanResults.successfulQueries?.length || 0} accessible objects
            </p>
          </div>
          <div className="p-6 space-y-4">
            {/* Successful Queries */}
            {scanResults.successfulQueries && scanResults.successfulQueries.length > 0 && (
              <div>
                <h4 className="font-medium text-green-900 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Found Objects ({scanResults.successfulQueries.length})
                </h4>
                <div className="space-y-2">
                  {scanResults.successfulQueries.map((obj: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-4 bg-green-50 rounded-lg border border-green-200"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono font-semibold text-green-800">{obj.object}</span>
                        <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">
                          {obj.count} records • {obj.api}
                        </span>
                      </div>
                      {obj.records && obj.records.length > 0 && (
                        <div className="text-sm space-y-1 mt-2">
                          {obj.records.map((r: any, ridx: number) => (
                            <div key={ridx} className="text-gray-700">
                              • {r.Name} <span className="text-gray-500 text-xs">({r.Id})</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Failed Queries Summary */}
            {scanResults.failedQueries && scanResults.failedQueries.length > 0 && (
              <details className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                <summary className="cursor-pointer font-medium text-gray-700">
                  Failed Queries ({scanResults.failedQueries.length})
                </summary>
                <div className="mt-3 space-y-1 text-xs text-gray-600">
                  {scanResults.failedQueries.slice(0, 10).map((obj: any, idx: number) => (
                    <div key={idx}>• {obj.object}</div>
                  ))}
                  {scanResults.failedQueries.length > 10 && (
                    <div className="text-gray-500 italic">
                      ... and {scanResults.failedQueries.length - 10} more
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
