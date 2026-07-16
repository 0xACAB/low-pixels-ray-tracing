'use client';
import { Tabs } from 'antd';
import Sphere from './Scenes/RayCasting/Sphere/Sphere';
import Triangle from './Scenes/RayCasting/Triangle/Triangle';

const items = [
    { Children: Sphere, label: 'Сцена со сферой' },
    { Children: Triangle, label: 'Сцена с треугольником' }
].map(({ Children, label }, i) => {
    return {
        key: String(i + 1),
        label,
        children: <Children />
    };
});
export default function Main({ mobile }) {
    return (
        <div className="flex flex-col w-full">
            <div className="flex flex-col w-full">
                <header className="flex flex-col w-full">
                    <div className="flex flex-row w-full justify-between">
                        <div className="flex flex-col w-1/3"></div>
                        <div className="flex flex-col w-1/3 items-center text-nowrap">
                            <span>{mobile ? 'Мобильная' : 'Десктопная'} версия.</span>
                            <span>Эксперименты c WebGPU</span>
                        </div>
                        <div className="w-1/3 grid justify-items-stretch"></div>
                    </div>
                </header>
                <div className="flex flex-row w-full divide-x-2">
                    <div className="w-full flex items-center flex-col">
                        <Tabs defaultActiveKey={'native'} items={items} />
                    </div>
                </div>
            </div>
        </div>
    );
}
