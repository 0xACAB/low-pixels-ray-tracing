import { Slider } from 'antd';

export default function SliderWrapper({ resolutions, resolutionIndex, onChange }) {
    const formatter = (value) => `${resolutions[value].width}x${resolutions[value].height}`;
    return (
        <div className="flex flex-col items-center mt-2">
            Resolution
            <Slider
                style={{ width: '20rem', marginTop: '0.5rem' }}
                tooltip={{ formatter, placement: 'bottom' }}
                min={0}
                max={resolutions.length - 1}
                onChange={onChange}
                value={typeof resolutionIndex === 'number' ? resolutionIndex : 0}
            />
        </div>
    );
}
