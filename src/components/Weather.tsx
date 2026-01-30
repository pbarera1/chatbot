type WeatherProps = {
    temperature: number;
    weather: string;
    location: string;
};

export const Weather = ({ temperature, weather, location }: WeatherProps) => {
    return (
        <div className="bg-white rounded-lg p-6 shadow-md border border-blue-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Current Weather for {location}
            </h2>
            <div className="space-y-3">
                <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                        Condition:
                    </span>
                    <span className="text-lg font-medium text-gray-800 capitalize">
                        {weather}
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                        Temperature:
                    </span>
                    <span className="text-2xl font-bold text-blue-600">
                        {temperature}°C
                    </span>
                </div>
            </div>
        </div>
    );
};
