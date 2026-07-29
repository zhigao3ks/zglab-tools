import { DesignTool } from './DesignTool';
import { DoiReferenceTool } from './DoiReferenceTool';
import { ExperimentalDataChart } from './ExperimentalDataChart';
import { ImageTool } from './ImageTool';
import { TextEnhancer } from './TextEnhancer';
import { TokenEstimator } from './TokenEstimator';

interface ToolIslandDispatcherProps {
  toolId: string;
}

export function ToolIslandDispatcher({ toolId }: ToolIslandDispatcherProps) {
  switch (toolId) {
    case 'image-compressor':
      return <ImageTool mode="compress" />;
    case 'image-resizer':
      return <ImageTool mode="resize" />;
    case 'image-converter':
      return <ImageTool mode="convert" />;
    case 'image-cropper':
      return <ImageTool mode="crop" />;
    case 'image-rounded-corners':
      return <ImageTool mode="round" />;
    case 'image-base64':
      return <ImageTool mode="base64" />;
    case 'ico-generator':
      return <ImageTool mode="ico" />;
    case 'image-color-picker':
      return <ImageTool mode="picker" />;
    case 'text-case-converter':
      return <TextEnhancer mode="case" />;
    case 'naming-converter':
      return <TextEnhancer mode="naming" />;
    case 'whitespace-cleaner':
      return <TextEnhancer mode="cleanup" />;
    case 'find-replace':
      return <TextEnhancer mode="find" />;
    case 'random-string-generator':
      return <TextEnhancer mode="random" />;
    case 'lorem-ipsum-generator':
      return <TextEnhancer mode="lorem" />;
    case 'contact-extractor':
      return <TextEnhancer mode="extract" />;
    case 'hidden-character-detector':
      return <TextEnhancer mode="hidden" />;
    case 'color-converter':
      return <DesignTool mode="color" />;
    case 'color-picker':
      return <DesignTool mode="picker" />;
    case 'gradient-generator':
      return <DesignTool mode="gradient" />;
    case 'css-shadow-generator':
      return <DesignTool mode="shadow" />;
    case 'css-radius-generator':
      return <DesignTool mode="radius" />;
    case 'rem-px-converter':
      return <DesignTool mode="rem" />;
    case 'screen-ratio-calculator':
      return <DesignTool mode="screen" />;
    case 'token-estimator':
      return <TokenEstimator />;
    case 'doi-reference-tool':
      return <DoiReferenceTool />;
    case 'experimental-data-chart':
      return <ExperimentalDataChart />;
    default:
      return null;
  }
}
