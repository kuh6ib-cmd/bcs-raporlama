# Implementation Plan - Price Correlation Analysis

## User Review Required
> [!IMPORTANT]
> We will add a dedicated **Fiyat Korelasyonu** (Price Correlation) view inside **MyBCS Veri Paneli**, featuring a correlation heatmap matrix between services and interactive scatter plots to analyze price relationships across dealers.

- **Feature Scope**:
  1. Calculate Pearson correlation coefficients between different service prices across matching dealers.
  2. **Correlation Heatmap Matrix**: Interactive grid showing correlation strengths between services (e.g. 180010 vs 180020).
  3. **Service Scatter Plot**: Select Service A and Service B to visualize dealer price scatter distribution and correlation trend line.
  4. **Key Insights**: Highlight top positively and negatively correlated service pairs.

## Proposed Changes

### Data & Logic (`src/utils/analysisUtils.ts` or `SPOSPRPipelineView.tsx`)
- Compute Pearson correlation coefficient $r$ between service price arrays across common dealers.
- Format matrix data for heatmap rendering.

### UI Component (`src/components/SPOSPRPipelineView.tsx` or new component)
- Add "Fiyat Korelasyonu" tab button alongside MyBCS Veri Paneli / Dealer Inspector.
- Build Heatmap view with tooltips showing correlation strength and sample dealer count.
- Build Scatter Plot comparator with dropdown selectors for Service X and Service Y.

## Verification Plan
- Compile applet with `compile_applet`.
- Verify correlation calculations with sample dataset.
