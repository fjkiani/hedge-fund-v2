/**
 * ToneBadge — HAWKISH / DOVISH / NEUTRAL badge
 */

import { Badge } from '../../ui/Badge';
import { toneToVariant } from '../utils';

interface ToneBadgeProps {
    tone: string;
}

export function ToneBadge({ tone }: ToneBadgeProps) {
    return <Badge variant={toneToVariant(tone)}>{tone}</Badge>;
}
