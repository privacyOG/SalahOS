import type { ReactNode } from 'react';

export interface BidiTextProps {
  readonly children: ReactNode;
}

export function BidiText({ children }: BidiTextProps) {
  return <bdi dir="auto">{children}</bdi>;
}
