

const Footer = () => {
  return (
    <div
      className="fixed bottom-0 left-0 w-full backdrop-blur-md"
      style={{
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <footer className="sticky bottom-0 w-full max-w-360 mx-auto flex items-center justify-center pb-5 px-4">
        <div className="text-center">
          <p className="text-sm text-gray-400 mb-1">
            Built for AI Safety Research
          </p>
          <p className="text-xs text-gray-500">
            © 2024 JailbreakGuard. Securing AI, one bounty at a time.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Footer;
