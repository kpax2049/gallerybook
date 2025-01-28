import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="h-screen flex flex-col items-center justify-center gap-2">
      404 Page Not Found
      <Link to="/">Home</Link>
    </div>
  );
}
