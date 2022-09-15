import React from "react";

interface TypeaheadProps {
  label: string;
  apiKey: string;
  onSelection: Function;
}

interface TypeaheadState {
  suggestions: Array<SmartySuggestion>;
  search: string;
}

interface SmartySuggestion {
  city: string;
  state: string;
  street_line: string;
  secondary: string;
  zipcode: string;
}

interface SmartyResult {
  components: {
    city_name: string;
    default_city_name: string;
    delivery_point: string;
    delivery_point_check_digit: string;
    plus4_code: string;
    primary_number: string;
    state_abbreviation: string;
    street_name: string;
    street_suffix: string;
    zipcode: string;
  };
}

export default class TypeAheadDropDown extends React.Component<
  TypeaheadProps,
  TypeaheadState
> {
  constructor(props: TypeaheadProps) {
    super(props);
    this.state = {
      suggestions: [],
      search: "",
    };
  }

  debounce = (cb: Function, delay: number): Function => {
    let timer: any;
    return (...args: any) => {
      clearTimeout(timer);
      timer = setTimeout(() => cb(...args), delay);
    };
  };

  fetchAddressSuggestions = async (value: string): Promise<void> => {
    if (value) {
      const res = await fetch(
        "https://us-autocomplete-pro.api.smartystreets.com/lookup?" +
          new URLSearchParams({
            key: this.props.apiKey,
            search: value,
          })
      );

      const data = await res.json();
      const { suggestions } = data;

      this.setState(() => ({
        suggestions,
      }));
    }
  };

  debouncedFetch: any = this.debounce(
    (value: string) => this.fetchAddressSuggestions(value),
    500
  );

  onTextChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { value } = e.target;

    if (value) {
      this.setState(() => ({
        search: value,
      }));
      this.debouncedFetch(value);
    } else {
      this.setState(() => ({
        search: value,
        suggestions: [],
      }));
    }
  };

  suggestionSelected = async (value: SmartySuggestion): Promise<void> => {
    if (value) {
      this.setState(() => ({
        search: this.formatAddress(value),
        suggestions: [],
      }));

      const res = await fetch(
        "https://us-street.api.smartystreets.com/street-address?" +
          new URLSearchParams({
            key: this.props.apiKey,
            city: value.city,
            state: value.state,
            street: value.street_line,
            secondary: value.secondary,
          })
      );

      const data: Array<SmartyResult> = await res.json();
      this.props.onSelection(data[0].components);
    } else {
      this.setState(() => ({
        search: "",
        suggestions: [],
      }));
    }
  };

  formatAddress = (addressObj: SmartySuggestion): string => {
    return `${addressObj.street_line} ${addressObj.secondary} ${addressObj.city} ${addressObj.state} ${addressObj.zipcode}`;
  };

  renderSuggestions = () => {
    const { suggestions } = this.state;

    if (suggestions.length === 0) {
      return null;
    }

    return (
      <ul>
        {suggestions.map((address: SmartySuggestion) => {
          return (
            <li
              key={this.formatAddress(address)}
              onClick={() => this.suggestionSelected(address)}
            >
              {this.formatAddress(address)}
            </li>
          );
        })}
      </ul>
    );
  };

  render() {
    const { search } = this.state;
    const { label } = this.props;

    return (
      <div className="TypeAheadDropDown">
        <input
          onChange={this.onTextChange}
          placeholder={label}
          value={search}
          type="text"
        />
        {this.renderSuggestions()}
      </div>
    );
  }
}