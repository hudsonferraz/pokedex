import React from "react";
import "./ErrorBoundary.css";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-shell" role="alert">
          <div className="error-boundary-card">
            <h1>Something went wrong</h1>
            <p>
              The Team Lab hit an unexpected error. Your teams are still in this
              browser&apos;s storage — reload to continue.
            </p>
            <button type="button" className="error-boundary-reload" onClick={this.handleReload}>
              Reload app
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
