namespace ScenarioTestRunner
{
    using System;

    public class PIDController
    {
        public double Kp { get; set; }
        public double Ki { get; set; }
        public double Kd { get; set; }
        private double _integral;
        private double _previousError;
        private double _previousMeasurement;
        private double _maxIntegral; // Anti-windup limit
        private double _maxOutput;   // Output clamping limit

        public PIDController(double kp, double ki, double kd, double maxIntegral = 100.0, double maxOutput = 100.0)
        {
            Kp = kp;
            Ki = ki;
            Kd = kd;
            _maxIntegral = maxIntegral;
            _maxOutput = maxOutput;
        }

        public double Compute(double setpoint, double measurement, double deltaTime)
        {
            double error = setpoint - measurement;

            // Proportional term
            double proportional = Kp * error;

            // Integral term (with anti-windup)
            _integral += error * deltaTime;
            _integral = Math.Clamp(_integral, -_maxIntegral, _maxIntegral);
            double integral = Ki * _integral;

            // Derivative term (using measurement to avoid derivative kick)
            double derivative = Kd * (_previousMeasurement - measurement) / deltaTime;

            // Save current values for next iteration
            _previousError = error;
            _previousMeasurement = measurement;

            // Calculate control output and clamp it
            double controlOutput = proportional + integral + derivative;
            controlOutput = Math.Clamp(controlOutput, -_maxOutput, _maxOutput);

            return controlOutput;
        }

        public void Reset()
        {
            _integral = 0;
            _previousError = 0;
            _previousMeasurement = 0;
        }
    }

    public static class HumiditySystemSimulator
    {
        public static double SimulateHumidityControl(
        double initialValue,
        double setpoint,
        double kp,
        double ki,
        double kd)
        {
            var pid = new PIDController(kp, ki, kd, maxIntegral: 50.0, maxOutput: 100.0);
            List<double> humidityHistory = new List<double>();
            double currentHumidity = initialValue;
            const double dt = 0.1; // Time step

            {
                // Calculate control output (e.g., humidifier/dehumidifier power)
                double control = pid.Compute(setpoint, currentHumidity, dt);

                // Simulate system response (first-order system)
                // dH/dt = (control - naturalHumidityChange) / humidityInertia
                double naturalHumidityChange = 0.05 * (50.0 - currentHumidity); // Natural drift toward 50% RH
                double humidityInertia = 10.0;                                 // System inertia
                currentHumidity += (control - naturalHumidityChange) / humidityInertia * dt;

                // Save current humidity
                humidityHistory.Add(currentHumidity);
            }

            return currentHumidity;
        }
    }

    public static class TemperatureSystemSimulator
    {
        public static double SimulateTemperatureControl(
            double initialValue,
            double setpoint,
            double kp,
            double ki,
            double kd)
        {
            var pid = new PIDController(kp, ki, kd, maxIntegral: 50.0, maxOutput: 100.0);
            double currentTemperature = initialValue;
            const double dt = 0.1; // Time step
                                   // Calculate control output (e.g., heater power)
            double control = pid.Compute(setpoint, currentTemperature, dt);

            // Simulate system response (first-order system)
            // dT/dt = (control - cooling) / thermalMass
            double cooling = 0.1 * currentTemperature; // Simple cooling effect
            double thermalMass = 10.0;                 // Thermal inertia
            currentTemperature += (control - cooling) / thermalMass * dt;

            return currentTemperature;
        }
    }

    public static class ParticleSystemSimulator
    {
        public static double SimulatePM10Control(
            double initialValue,
            double setpoint,
            double kp,
            double ki,
            double kd)
        {
            var pid = new PIDController(kp, ki, kd, maxIntegral: 50.0, maxOutput: 100.0);
            double currentPM10 = initialValue;
            const double dt = 0.1; // Time step

            // Calculate control output (e.g., air purifier power)
            double control = pid.Compute(setpoint, currentPM10, dt);

            // Simulate system response (first-order system)
            // dPM/dt = (control - naturalAirFlow) / airFiltrationEfficiency
            double naturalAirFlow = 0.02 * (50.0 - currentPM10); // Natural dissipation toward 50 µg/m³
            double airFiltrationEfficiency = 10.0;               // Efficiency of air cleaning system
            currentPM10 += (control - naturalAirFlow) / airFiltrationEfficiency * dt;

            return currentPM10;
        }
    }
}
