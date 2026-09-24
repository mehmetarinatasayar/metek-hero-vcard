import type { Ref } from "react";
import Svg, { Rect, Text as SvgText } from "react-native-svg";
import QRCode from "react-native-qrcode-svg";
import { theme } from "../theme";

/** Brand stays outside the code and its white scanning margin, including PNG exports. */
export function BrandedQr({ value, size, svgRef }: { value: string; size: number; svgRef: Ref<Svg> }) {
  return (
    <Svg ref={svgRef} width={size} height={size * 1200 / 1024}
      viewBox="0 0 1024 1200" accessibilityLabel="METEK HERO markalı kartvizit QR kodu">
      <Rect width={1024} height={1200} fill="#FFFFFF" />
      <QRCode value={value} size={1024} quietZone={96} color="#222222" backgroundColor="#FFFFFF" ecl="M" />
      <Rect x={0} y={1024} width={1024} height={176} fill={theme.colors.primary} />
      <SvgText x={512} y={1100} textAnchor="middle" fontFamily="Arial" fontSize={52} fontWeight="bold" fill="#FFFFFF">METEK HERO</SvgText>
      <SvgText x={512} y={1152} textAnchor="middle" fontFamily="Arial" fontSize={27} fill="#FFFFFF">DİJİTAL KARTVİZİT</SvgText>
    </Svg>
  );
}
