import { useEffect, useState } from "react";

interface CountdownTimerProps {
  targetDate: Date;
  label: string;
  accentColor?: "yellow" | "red" | "blue" | "white";
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const CountdownTimer = ({ targetDate, label, accentColor = "yellow" }: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    };
    return date.toLocaleDateString('es-MX', options);
  };

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = targetDate.getTime();
      const difference = target - now;

      if (difference > 0) {
        const totalSeconds = Math.floor(difference / 1000);
        const totalMinutes = Math.floor(totalSeconds / 60);
        const totalHours = Math.floor(totalMinutes / 60);
        const days = Math.floor(totalHours / 24);
        
        const hours = totalHours % 24;
        const minutes = totalMinutes % 60;
        const seconds = totalSeconds % 60;

        return { days, hours, minutes, seconds };
      }

      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    };

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    setTimeLeft(calculateTimeLeft());

    return () => clearInterval(timer);
  }, [targetDate, label]);

  const accentClasses = {
    yellow: "border-primary text-primary",
    red: "border-accent text-accent",
    blue: "border-america-blue text-america-blue",
    white: "border-white text-white",
  };

  return (
    <div className="flex flex-col items-center space-y-2 md:space-y-3 w-full">
      <div className="text-center w-full">
        <h3 className="text-white text-sm sm:text-base md:text-lg font-bold leading-tight px-2">{label}</h3>
        <p className="text-white/80 text-xs sm:text-xs md:text-sm mt-1">{formatDate(targetDate)}</p>
      </div>
      <div className="flex gap-2 sm:gap-2 md:gap-3 justify-center w-full px-1">
        {Object.entries(timeLeft).map(([unit, value]) => (
          <div
            key={unit}
            className={`flex flex-col items-center bg-white/10 backdrop-blur-sm rounded-lg md:rounded-xl p-2 sm:p-2.5 md:p-3 min-w-[52px] sm:min-w-[58px] md:min-w-[70px] border ${accentClasses[accentColor]}`}
          >
            <span className={`text-xl sm:text-2xl md:text-3xl font-bold ${accentClasses[accentColor]} leading-none`}>
              {value.toString().padStart(2, "0")}
            </span>
            <span className="text-white text-[10px] sm:text-xs md:text-xs mt-1 capitalize leading-none">
              {unit === 'days' ? 'días' : unit === 'hours' ? 'hrs' : unit === 'minutes' ? 'min' : 'seg'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
