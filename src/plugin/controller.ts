import { colorToString, solidPaintToColor } from 'utils/color';
import { MessageTypes, SetSelectedPaintStylesMessage } from 'declarations/messages';
import { recurseChildren } from 'utils/figma';
import { isRectangleNode } from 'utils/guards';
import { copyToClipboard } from './handlers/copyToClipboard';
import { importColors } from './handlers/imporColors';
import { ascending } from 'd3-array';

figma.showUI(__html__, {
  width: 400,
  height: 600,
  themeColors: true,
});

figma.on('selectionchange', () => {
  console.log('selection changed');
  // const paintStyles = figma.getLocalPaintStyles();

  const selectedRectangles = Array.from(recurseChildren(figma.currentPage.selection))
    .filter(isRectangleNode)
    .filter((node) => {
      // console.log({ node });
      return 'fills' in node;
    });

  // sort items
  // left to right, then bottom down
  selectedRectangles.sort((a, b) => ascending(a.x, b.x)).sort((a, b) => ascending(a.y, b.y));

  // get all unique colors
  // const colorSet = new Set();
  const selectedPaints: SolidPaint[] = selectedRectangles.flatMap((rect) => {
    if (Array.isArray(rect.fills)) {
      return rect.fills;
    }
    return [];
  });

  // selectedPaintStyles.forEach((paint) => {
  //   const colorId = JSON.stringify(paint.color);
  //   if (colorSet.has(colorId)) {
  //     return
  //   } else {
  //     colorSet.add(colorId)
  //   }
  // });
  // console.log(selectedPaints.map(paint => paint.color.toString()));
  const paintsAsHex = selectedPaints.map((paint) => {
    const color = solidPaintToColor(paint);
    return colorToString(color, 'HEX');
  });

  //  Avoid spam when array empty
  if (paintsAsHex.length) {
    console.log(paintsAsHex);
  }


  const selectedPaintStyles: PaintStyle[] = selectedPaints.map((paint, i) => {
    return {
      id: `id_${i}`,
      description: 'foo',
      key: `id_${i}`,
      name: `id_${i}`,
      paints: [paint],
      remote: false,
      type: 'PAINT',
    } as unknown as PaintStyle;
  });

  // console.log({ selectedPaintStyles  });

  // .map(
  //     ((ps, i)) =>
  //       ({
  //         id: ps.id,
  //         description: ps.description,
  //         key: ps.key,
  //         name: ps.name,
  //         paints: ps.paints,
  //         remote: ps.remote,
  //         type: ps.type,
  //       } as PaintStyle)
  //   );

  const message: SetSelectedPaintStylesMessage = {
    type: MessageTypes.SET_SELECTED_PAINT_STYLES,
    styles: selectedPaintStyles,
  };

  figma.ui.postMessage(message);
});

figma.ui.onmessage = (message) => {
  console.log('figma.ui.onmessage', message);

  switch (message.type) {
    case MessageTypes.NOTIFY:
      copyToClipboard(message);
      break;
    case MessageTypes.IMPORT_COLORS:
      importColors(message);
    default:
      break;
  }
};
