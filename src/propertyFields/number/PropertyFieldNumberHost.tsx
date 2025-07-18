import * as React from 'react';
import { TextField } from '@fluentui/react/lib/TextField';
import { IPropertyFieldNumberHostProps, IPropertyFieldNumberHostState } from './IPropertyFieldNumberHost';
import * as telemetry from '../../common/telemetry';
import { Async } from '@fluentui/react/lib/Utilities';
import * as strings from 'PropertyControlStrings';
import { GeneralHelper } from '../../helpers/GeneralHelper';

export default class PropertyFieldNumberHost extends React.Component<IPropertyFieldNumberHostProps, IPropertyFieldNumberHostState> {
  private _async: Async;
  private _delayedChange: (value: string) => void;

  constructor(props: IPropertyFieldNumberHostProps) {
    super(props);

    telemetry.track('PropertyFieldNumber', {
      disabled: props.disabled
    });

    let value: string | null = null;
    let nrValue: number | undefined = undefined;
    if (GeneralHelper.isDefined(props.value)) {
      value = props.value.toString();

      if (!GeneralHelper.isDefined(props.precision)) {
        nrValue = props.value;
      }
      else if (props.precision === 0) {
        nrValue = parseInt(value);
      }
      else {
        const multiplier = Math.pow(10, props.precision);
        nrValue = Math.round((parseFloat(value) + 0.000000000000001) * multiplier) / multiplier;
      }
    }

    this.state = {
      value: value,
      roundedValue: nrValue
    };

    this._async = new Async(this);
    this._delayedChange = this._async.debounce(this._onChanged, this.props.deferredValidationTime ? this.props.deferredValidationTime : 200);
  }

  /**
   * componentDidUpdate lifecycle hook
   *
   * @param prevProps
   * @param prevState
   */
  public componentDidUpdate(prevProps: IPropertyFieldNumberHostProps, prevState: IPropertyFieldNumberHostState): void {
    if (prevProps.value !== this.props.value && this.props.value !== this.state.roundedValue) {
      this.setState({
        value: GeneralHelper.isDefined(this.props.value) ? this.props.value.toString() : null
      });
    }
  }

  /**
   * componentWillUnmount lifecycle hook
   */
  public componentWillUnmount(): void {
    this._async.dispose();
  }

  /**
   * Validate if field value is a number
   * @param value
   */
  private _validateNumber = (value: string): string | Promise<string> => {
    const nrValue = !GeneralHelper.isDefined(this.props.precision) || this.props.precision === 0 ? parseInt(value) : parseFloat(value);

    if (isNaN(nrValue)) {
      return `${strings.NotNumberValidationMessage} ${value}.`;
    }

    const {
      minValue,
      maxValue
    } = this.props;

    // Check if number is lower or equal to minimum value
    if (GeneralHelper.isDefined(minValue) && nrValue < minValue) {
      return `${strings.MinimumNumberValidationMessage} ${minValue}`;
    }
    // Check if the number is greater than the maximum value
    if (GeneralHelper.isDefined(maxValue) && nrValue > maxValue) {
      return `${strings.MaximumNumberValidationMessage} ${maxValue}`;
    }

    if (this.props.onGetErrorMessage) {
      return this.props.onGetErrorMessage(nrValue);
    } else {
      return '';
    }
  }

  /**
   * On field change event handler
   */
  private _onChanged = (value: string): void => {
    let nrValue: number;
    const {
      precision
    } = this.props;
    if (!GeneralHelper.isDefined(precision)) {
      nrValue = parseFloat(value);
    }
    else if (precision === 0) {
      nrValue = parseInt(value);
    }
    else {
      const multiplier = Math.pow(10, precision);
      nrValue = Math.round((parseFloat(value) + 0.000000000000001) * multiplier) / multiplier;
    }

    // Update state
    this.setState({
      value,
      roundedValue: nrValue
    });

    const {
      minValue,
      maxValue
    } = this.props;

    if (!isNaN(nrValue)) {
      if ((!GeneralHelper.isDefined(minValue) || nrValue >= minValue) && (!GeneralHelper.isDefined(maxValue) || nrValue <= maxValue)) {
        // Trigger change for the web part
        this.props.onChanged(nrValue);
      }
    }
    else {
      this.props.onChanged(undefined);
    }
  }

  /**
   * Render field
   */
  public render(): JSX.Element {
    return (
      <div>
        <TextField label={this.props.label}
          ariaLabel={this.props.ariaLabel}
          onChange={(e, value) => this._delayedChange(value)}
          defaultValue={this.state.value}
          description={this.props.description}
          placeholder={this.props.placeholder}
          errorMessage={this.props.errorMessage}
          onGetErrorMessage={this._validateNumber}
          deferredValidationTime={this.props.deferredValidationTime}
          disabled={this.props.disabled} />
      </div>
    );
  }
}
