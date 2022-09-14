import React, { useEffect, useMemo, useState } from "react";
import { Autocomplete, CircularProgress, TextField } from "@mui/material";

interface TypeaheadProps {
  apiKey: string;
  label: string;
  onSelection: any;
}

interface SmartySuggestion {
  city: string;
  state: string;
  street_line: string;
  secondary: string;
  zipcode: string;
}

// interface SmartyAddress {
//   city_name: string;
//   default_city_name: string;
//   delivery_point: string;
//   delivery_point_check_digit: string;
//   plus4_code: string;
//   primary_number: string;
//   state_abbreviation: string;
//   street_name: string;
//   street_suffix: string;
//   zipcode: string;
// }

const Typeahead = (props: TypeaheadProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [options, setOptions] = useState([]);
  const autoCompleteLoading = open && options.length === 0;

  // Debounce autocomplete search
  const handleSearch = useMemo(() => debounce(setSearch, 250, false), []);

  // Handles selection of autocomplete option
  const handleChange = async (val: SmartySuggestion | null) => {
    if (!val) return;

    const res = await fetch(
      "https://us-street.api.smartystreets.com/street-address?" +
        new URLSearchParams({
          key: props.apiKey,
          city: val.city,
          state: val.state,
          street: val.street_line,
          secondary: val.secondary,
        })
    );

    const data = await res.json();
    props.onSelection(data[0].components);
  };

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  // Handles search changes
  useEffect(() => {
    const getAddressResults = async () => {
      const res = await fetch(
        "https://us-autocomplete-pro.api.smartystreets.com/lookup?" +
          new URLSearchParams({
            key: props.apiKey,
            search: search,
          })
      );
      const data = await res.json();
      setOptions(data.suggestions || []);
    };

    if (search) {
      getAddressResults();
    }
  }, [props.apiKey, search]);

  // Reset options on close
  useEffect(() => {
    if (!open) {
      setOptions([]);
    }
  }, [open]);

  return (
    <>
      <form>
        <Autocomplete
          id="ss-autocomplete"
          open={open}
          loading={autoCompleteLoading}
          options={options}
          onOpen={handleOpen}
          onClose={handleClose}
          onChange={(event: any, val: SmartySuggestion | null) =>
            handleChange(val)
          }
          /*
      // @ts-ignore */
          onInputChange={(event: any, val: string) => handleSearch(val)}
          getOptionLabel={(option: SmartySuggestion) => formatAddress(option)}
          isOptionEqualToValue={(
            option: SmartySuggestion,
            value: SmartySuggestion
          ) => option.street_line === value.street_line}
          renderInput={(params: any) => (
            <TextField
              {...params}
              label={props.label || "Enter an address"}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {autoCompleteLoading ? (
                      <CircularProgress color="inherit" size={20} />
                    ) : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />
      </form>
    </>
  );
};

export default Typeahead;

const debounce = (func: any, wait: number, immediate: boolean) => {
  let timeout: any;

  return function executedFunction(this: any) {
    const context = this;
    const args = arguments;

    /** The function to execute at the end of the debounce timer */
    const later = () => {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };

    const callNow = immediate && !timeout;

    clearTimeout(timeout);

    timeout = setTimeout(later, wait);

    if (callNow) func.apply(context, args);
  };
};

const formatAddress = (addressObj: SmartySuggestion) => {
  return `${addressObj.street_line} ${addressObj.secondary} ${addressObj.city} ${addressObj.state} ${addressObj.zipcode}`;
};
