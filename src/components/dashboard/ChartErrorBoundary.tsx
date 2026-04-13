import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ChartErrorBoundaryProps {
  children: ReactNode
  title: string
}

interface ChartErrorBoundaryState {
  hasError: boolean
}

export default class ChartErrorBoundary extends Component<
  ChartErrorBoundaryProps,
  ChartErrorBoundaryState
> {
  state: ChartErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ChartErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Chart rendering failed', {
      title: this.props.title,
      error,
      errorInfo,
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="status"
          className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
        >
          {this.props.title} chart is unavailable right now. Please try adjusting your inputs.
        </div>
      )
    }

    return this.props.children
  }
}
