import { ManagedDisplayRemoteController } from './ManagedDisplayRemoteController';
import { SmartDisplayApplication } from './SmartDisplayApplication';
import '../family-classroom-4k.css';

export function SmartDisplayRoot() {
  return (
    <>
      <ManagedDisplayRemoteController />
      <SmartDisplayApplication />
    </>
  );
}
