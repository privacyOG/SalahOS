import { AustralianMosqueDirectoryPanel } from './AustralianMosqueDirectoryPanel';
import { MosquesScreen } from './MosquesScreen';
import { SharedMosqueDirectoryPanel } from './SharedMosqueDirectoryPanel';

export function MosquesRoute() {
  return (
    <>
      <MosquesScreen />
      <AustralianMosqueDirectoryPanel />
      <SharedMosqueDirectoryPanel />
    </>
  );
}
