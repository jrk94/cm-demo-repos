using ScenarioTestRunner.Objects;

namespace ScenarioTestRunner.Handlers
{
    public static class HandlerUtilities
    {
        static Random random = new Random();

        // Earth’s radius in meters
        const double EarthRadius = 6371000;

        public static Func<double, double> CompileContext(Context context, double defaultValue)
        {
            return context.Behavior switch
            {
                "y=x" => x => x,
                "low" => x => 1.000002 * x,
                "mid" => x => 1.00002 * x,
                "high" => x => 1.0002 * x,
                "decreaseLow" => x => x - 1.000002 * x,
                "decreaseMid" => x => x - 1.00002 * x,
                "decreaseHigh" => x => x - 1.0002 * x,
                "randomControl" => x =>
                {
                    var setpoint = Convert.ToDouble(context.Setpoint);
                    var rand = new Random();
                    return defaultValue + rand.NextDouble() * (setpoint * 2) - setpoint;
                }
                ,
                "humidityControl" => x =>
                {
                    return HumiditySystemSimulator.SimulateHumidityControl(
                        initialValue: x,
                        setpoint: Convert.ToDouble(context.Setpoint),
                        kp: 0.5,
                        ki: 0.02,
                        kd: 0.1
                    );
                }
                ,
                "temperatureControl" => x =>
                {
                    return TemperatureSystemSimulator.SimulateTemperatureControl(
                        initialValue: x,
                        setpoint: Convert.ToDouble(context.Setpoint),
                        kp: 0.8,
                        ki: 0.05,
                        kd: 0.2
                    );
                }
                ,
                "particleControl" => x =>
                {
                    return ParticleSystemSimulator.SimulatePM10Control(
                        initialValue: x,
                        setpoint: Convert.ToDouble(context.Setpoint),
                        kp: 1.2,
                        ki: 0.5,
                        kd: 0.1
                    );
                }
                ,
                _ => x => x // Default to y=x if function is unknown
            };
        }

        public static (double, double) DefaultGenerateRandomCoordinates()
        {
            double baseLatitude = 37.7749;  // Example: San Francisco
            double baseLongitude = -122.4194;
            double radius = 1000; // 1 km radius

            return GenerateRandomCoordinate(baseLatitude, baseLongitude, radius);
        }

        public static (double, double) GenerateRandomCoordinate(double baseLat, double baseLon, double radiusMeters)
        {
            // Convert radius from meters to degrees
            double radiusInDegrees = radiusMeters / EarthRadius * (180 / Math.PI);

            // Generate random distances within the radius
            double u = random.NextDouble();
            double v = random.NextDouble();
            double w = radiusInDegrees * Math.Sqrt(u);
            double t = 2 * Math.PI * v;

            // Convert polar to cartesian coordinates
            double latOffset = w * Math.Cos(t);
            double lonOffset = w * Math.Sin(t) / Math.Cos(baseLat * Math.PI / 180);

            // New latitude and longitude
            double newLat = baseLat + latOffset;
            double newLon = baseLon + lonOffset;

            return (newLat, newLon);
        }

        public static IHandler CheckIfLoopScenario(this IHandler handler, double currentValue)
        {
            // Loop is triggered either by time or if a setpoint is reached
            if (handler.IsInLoopScenario ||
                currentValue > handler.LoopScenario.Context.Setpoint ||
                handler.LoopScenario != null && handler.LoopScenario.T != 0 && handler.CurrentTime > handler.LoopScenario.T)
            {
                handler.CurrentTime = 0;
                handler.CurrentScenario = handler.LoopScenario;
                handler.MathFunction = HandlerUtilities.CompileContext(handler.LoopScenario.Context, handler.DefaultValue);
                handler.CurrentScenarioIndex = 0;
                handler.IsInLoopScenario = true;

                if (currentValue <= handler.DefaultValue)
                {
                    handler.CurrentScenario = handler.Scenarios.First();
                    handler.MathFunction = HandlerUtilities.CompileContext(handler.CurrentScenario.Context, handler.DefaultValue);
                    handler.IsInLoopScenario = false;
                }
            }
            return handler;
        }
    }

}
