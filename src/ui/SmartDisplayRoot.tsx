import { ManagedDisplayRemoteController } from './ManagedDisplayRemoteController';
import { SmartDisplayApplication } from './SmartDisplayApplication';

export function SmartDisplayRoot() {
  return (
    <>
      <ManagedDisplayRemoteController />
      <SmartDisplayApplication />
    </>
  );
}
