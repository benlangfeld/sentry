import {forwardRef} from 'react';
import styled from '@emotion/styled';

import type {SVGIconProps} from './svgIcon';

interface Props extends SVGIconProps {
  side?: 'left' | 'right';
}

const IconParenthesis = forwardRef<SVGSVGElement, Props>(
  ({side = 'left', ...props}, ref) => {
    return (
      <StyledIcon
        ref={ref}
        data-test-id="icon-parenthesis"
        viewBox="0 0 5 26"
        data-paren-side={side}
        fill={props.color ?? 'currentColor'}
        {...props}
      >
        <path d="M0.912109 12.9542C0.912109 12.4473 0.955078 4.60684 1.04102 4.15748C1.12695 3.70453 1.24219 3.28572 1.38672 2.90107C1.53516 2.52361 1.70508 2.1767 1.89648 1.86035C2.0918 1.544 2.29688 1.2636 2.51172 1.01915C2.72266 0.774698 2.93945 0.567992 3.16211 0.399032C3.38477 0.226478 3.59961 0.093467 3.80664 0L4.08789 0.749533C3.96289 0.835811 3.83789 0.940062 3.71289 1.06229C3.58789 1.18451 3.46484 1.32292 3.34375 1.4775C3.17578 1.69679 3.01758 1.95382 2.86914 2.2486C2.72461 2.54338 2.59961 2.86512 2.49414 3.21383C2.39648 3.54096 2.31836 3.90225 2.25977 4.29768C2.20508 4.69312 2.17773 12.4832 2.17773 12.9434V13.0566C2.17773 13.506 2.20508 21.2871 2.25977 21.6754C2.31445 22.06 2.37891 22.3871 2.45312 22.6568C2.54688 22.9803 2.6543 23.2805 2.77539 23.5573C2.90039 23.8341 3.03125 24.0785 3.16797 24.2906C3.3125 24.5063 3.46289 24.6969 3.61914 24.8622C3.77539 25.0276 3.93164 25.166 4.08789 25.2774L3.80664 26C3.59961 25.9065 3.38477 25.7735 3.16211 25.601C2.93945 25.432 2.7207 25.2253 2.50586 24.9809C2.29102 24.7364 2.08594 24.456 1.89062 24.1396C1.69922 23.8269 1.53125 23.4782 1.38672 23.0935C1.24219 22.7125 1.12695 22.2991 1.04102 21.8533C0.955078 21.4039 0.912109 13.5599 0.912109 13.0458V12.9542Z" />
      </StyledIcon>
    );
  }
);

const StyledIcon = styled('svg')`
  &[data-paren-side='right'] {
    transform: rotate(180deg);
  }
`;

IconParenthesis.displayName = 'IconParenthesis';

export {IconParenthesis};
