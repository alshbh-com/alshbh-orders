import { Link } from "react-router-dom";

export default function AlshbhWatermark() {
  return (
    <div className="w-full py-4 text-center border-t border-border bg-muted/50">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        صُنع بواسطة
        <span className="font-bold text-primary">Alshbh Media</span>
      </Link>
    </div>
  );
}
