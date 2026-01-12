interface CardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  href?: string;
}

export default function Card({ title, description, icon, onClick, href }: CardProps) {
  const content = (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition cursor-pointer h-full">
      {icon && <div className="mb-3 text-blue-600">{icon}</div>}
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );

  if (href) {
    return (
      <a href={href} className="block h-full">
        {content}
      </a>
    );
  }

  return <div onClick={onClick}>{content}</div>;
}
