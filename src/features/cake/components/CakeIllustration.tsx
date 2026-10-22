import { flavorColors, type CakeRecipe } from '../../../shared/models/cake'

export function CakeIllustration({
  recipe,
  extinguishedCandleIds = [],
}: {
  recipe: CakeRecipe
  extinguishedCandleIds?: string[]
}) {
  return (
    <svg
      className="cake-illustration"
      viewBox="0 0 360 300"
      role="img"
      aria-label={`${recipe.flavor} cake ${recipe.tiers} ထပ် 2D နမူနာ`}
    >
      <ellipse cx="180" cy="263" rx="127" ry="18" fill="#e6dce5" />
      <rect x="167" y="253" width="26" height="25" rx="6" fill="#ded3dc" />
      <ellipse cx="180" cy="282" rx="58" ry="8" fill="#e6dce5" />
      {Array.from({ length: recipe.tiers }, (_, index) => {
        const width = [236, 176, 116][index],
          y = 202 - index * 58
        return (
          <g key={index}>
            <rect
              x={180 - width / 2}
              y={y}
              width={width}
              height="51"
              rx="7"
              fill={flavorColors[recipe.flavor]}
            />
            <rect
              x={180 - width / 2}
              y={y + 25}
              width={width}
              height="5"
              fill={recipe.creamColor}
            />
            <ellipse
              cx="180"
              cy={y + 2}
              rx={width / 2}
              ry="17"
              fill={recipe.creamColor}
            />
            <path
              d={`M${180 - width / 2} ${y + 45} Q180 ${y + 63} ${180 + width / 2} ${y + 45}`}
              stroke={recipe.accentColor}
              strokeWidth="4"
              fill="none"
            />
            {recipe.decoration !== 'plain' &&
              Array.from({ length: 9 }, (_, i) => (
                <circle
                  key={i}
                  cx={180 - width / 2 + 12 + (i * (width - 24)) / 8}
                  cy={y + 3 + Math.sin((i / 8) * Math.PI) * 9}
                  r={recipe.decoration === 'berries' ? 5 : 3}
                  fill={recipe.accentColor}
                />
              ))}
          </g>
        )
      })}
      {recipe.strokes.map((stroke) => {
        const radius = [118, 88, 58][recipe.tiers - 1]
        const y = 204 - (recipe.tiers - 1) * 58
        if (stroke.points.length === 1) {
          const point = stroke.points[0]
          return (
            <circle
              key={stroke.id}
              cx={180 + point.x * radius}
              cy={y + point.z * 14}
              r={Math.max(1.2, stroke.width * radius) / 2}
              fill={stroke.color}
            />
          )
        }
        return (
          <polyline
            key={stroke.id}
            points={stroke.points
              .map((point) => `${180 + point.x * radius},${y + point.z * 14}`)
              .join(' ')}
            fill="none"
            stroke={stroke.color}
            strokeWidth={Math.max(1.2, stroke.width * radius)}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )
      })}
      {recipe.candles.map((candle) => {
        const isExtinguished = extinguishedCandleIds.includes(candle.id)
        const radius = [118, 88, 58][recipe.tiers - 1]
        const x = 180 + candle.position.x * radius,
          y = 204 - (recipe.tiers - 1) * 58 + candle.position.z * 14
        return (
          <g key={candle.id} opacity={isExtinguished ? 0.8 : 1}>
            <path d={`M${x} ${y} v-28`} stroke={candle.color} strokeWidth="5" />
            {!isExtinguished && (
              <ellipse cx={x} cy={y - 33} rx="3" ry="5" fill="#ffc66b" />
            )}
            {['number', 'heart', 'star'].includes(candle.design) && (
              <text
                x={x}
                y={y - 13}
                textAnchor="middle"
                fill={candle.color}
                stroke="#fff"
                strokeWidth=".3"
                fontSize="16"
                fontWeight="bold"
              >
                {candle.design === 'number'
                  ? candle.digit
                  : candle.design === 'heart'
                    ? '♥'
                    : '★'}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
